# XRPL WebSocket Functionality and Architecture: Comprehensive Lesson Plan

This document provides a detailed, code-based breakdown of the WebSocket functionality in the XRPL (XRP Ledger) source code. It covers every aspect of the WebSocket subsystem, including connection acceptance, protocol detection, session management, message processing, upgrades, message sending, queueing, closing, and integration with the RPC and subscription systems. All explanations are strictly grounded in the provided source code and documentation.

---

## Table of Contents

- [WebSocket Overview](#websocket-overview)
- [Connection Acceptance and Protocol Detection](#connection-acceptance-and-protocol-detection)
  - [Door and Detector](#door-and-detector)
  - [Peer Handler Creation](#peer-handler-creation)
- [HTTP Session and WebSocket Upgrade](#http-session-and-websocket-upgrade)
  - [PlainHTTPPeer and SSLHTTPPeer](#plainhttppeer-and-sslhttppeer)
  - [Session::websocketUpgrade](#sessionwebsocketupgrade)
- [WSSession Interface and Implementations](#wssession-interface-and-implementations)
  - [WSSession](#wssession)
  - [BaseWSPeer, PlainWSPeer, SSLWSPeer](#basewspeer-plainwspeer-sslwspeer)
- [WebSocket Session Lifecycle](#websocket-session-lifecycle)
  - [run() and Handshake](#run-and-handshake)
  - [Reading Messages](#reading-messages)
  - [Message Processing and onWSMessage](#message-processing-and-onwsmessage)
  - [Sending Messages](#sending-messages)
  - [Message Queueing and Flow Control](#message-queueing-and-flow-control)
  - [Closing and Cleanup](#closing-and-cleanup)
- [WebSocket Subscription and Notification](#websocket-subscription-and-notification)
  - [WSInfoSub](#wsinfosub)
- [Integration with RPC and ServerHandler](#integration-with-rpc-and-serverhandler)
  - [onHandoff and WebSocket Upgrade](#onhandoff-and-websocket-upgrade)
  - [onWSMessage and processSession](#onwsmessage-and-processsession)
- [Thread Safety and Asynchrony](#thread-safety-and-asynchrony)
- [References to Source Code](#references-to-source-code)

---

## WebSocket Overview

- XRPL supports both plain and SSL WebSocket connections for client RPC and real-time event subscriptions.
- WebSocket sessions are managed by a hierarchy of classes: `WSSession` (interface), `BaseWSPeer` (template base), and concrete implementations (`PlainWSPeer`, `SSLWSPeer`).
- The system is fully asynchronous and thread-safe, using Boost.Asio strands and coroutines.

---

## Connection Acceptance and Protocol Detection

### Door and Detector

- The `Door` class template ([include/xrpl/server/detail/Door.h]) manages incoming TCP connections for the XRPL server.
- The `run()` method starts the asynchronous accept loop:
  - Uses `boost::asio::spawn` to launch a coroutine on the strand.
  - The coroutine executes `do_accept`, which loops, accepting new connections.
- In `do_accept`, after accepting a connection:
  - If both SSL and plain are enabled, a `Detector` is created to detect the protocol.
  - If only one is enabled, the appropriate handler is created directly.

#### Code Snippet

```cpp
if (ssl_ && plain_) {
    if (auto sp = ios().template emplace<Detector>(
            port_, handler_, ioc_, std::move(stream), remote_address, j_))
        sp->run();
} else if (ssl_ || plain_) {
    create(
        ssl_, boost::asio::null_buffers{}, std::move(stream), remote_address);
}
```

- The `Detector` class detects whether the connection is SSL or plain and dispatches to the correct handler.

### Peer Handler Creation

- The `create` method ([include/xrpl/server/detail/Door.h]) instantiates either an `SSLHTTPPeer` or `PlainHTTPPeer` and calls `run()` to start the session.

```cpp
template <class Handler>
template <class ConstBufferSequence>
void
Door<Handler>::create(
    bool ssl,
    ConstBufferSequence const& buffers,
    stream_type&& stream,
    endpoint_type remote_address)
{
    if (ssl)
    {
        if (auto sp = ios().template emplace<SSLHTTPPeer<Handler>>(
                port_,
                handler_,
                ioc_,
                j_,
                remote_address,
                buffers,
                std::move(stream)))
            sp->run();
        return;
    }
    if (auto sp = ios().template emplace<PlainHTTPPeer<Handler>>(
            port_,
            handler_,
            ioc_,
            j_,
            remote_address,
            buffers,
            std::move(stream)))
        sp->run();
}
```

---

## HTTP Session and WebSocket Upgrade

### PlainHTTPPeer and SSLHTTPPeer

- `PlainHTTPPeer` ([include/xrpl/server/detail/PlainHTTPPeer.h]) and `SSLHTTPPeer` ([include/xrpl/server/detail/SSLHTTPPeer.h]) handle HTTP sessions over plain and SSL connections, respectively.
- Both implement the `Session` interface and provide a `websocketUpgrade()` method to upgrade the session to a WebSocket.

#### PlainHTTPPeer::websocketUpgrade

```cpp
template <class Handler>
std::shared_ptr<WSSession>
PlainHTTPPeer<Handler>::websocketUpgrade()
{
    auto ws = this->ios().template emplace<PlainWSPeer<Handler>>(
        this->port_,
        this->handler_,
        this->remote_address_,
        std::move(this->message_),
        std::move(stream_),
        this->journal_);
    return ws;
}
```

#### SSLHTTPPeer::websocketUpgrade

```cpp
template <class Handler>
std::shared_ptr<WSSession>
SSLHTTPPeer<Handler>::websocketUpgrade()
{
    auto ws = this->ios().template emplace<SSLWSPeer<Handler>>(
        this->port_,
        this->handler_,
        this->remote_address_,
        std::move(this->message_),
        std::move(this->stream_ptr_),
        this->journal_);
    return ws;
}
```

- These methods create a new `WSSession` (either `PlainWSPeer` or `SSLWSPeer`) and return it.

### Session::websocketUpgrade

- The `Session` interface ([include/xrpl/server/Session.h]) declares:

```cpp
virtual std::shared_ptr<WSSession>
websocketUpgrade() = 0;
```

- This is a pure virtual function, implemented by `PlainHTTPPeer` and `SSLHTTPPeer` to perform the upgrade.

---

## WSSession Interface and Implementations

### WSSession

- The `WSSession` interface ([include/xrpl/server/WSSession.h]) defines the contract for WebSocket sessions:

```cpp
struct WSSession
{
    std::shared_ptr<void> appDefined;

    virtual ~WSSession() = default;
    WSSession() = default;
    WSSession(WSSession const&) = delete;
    WSSession& operator=(WSSession const&) = delete;

    virtual void run() = 0;
    virtual Port const& port() const = 0;
    virtual http_request_type const& request() const = 0;
    virtual boost::asio::ip::tcp::endpoint const& remote_endpoint() const = 0;
    virtual void send(std::shared_ptr<WSMsg> w) = 0;
    virtual void close() = 0;
    virtual void close(boost::beast::websocket::close_reason const& reason) = 0;
    virtual void complete() = 0;
};
```

- `run()`: Start the WebSocket session.
- `send()`: Send a message to the client.
- `close()`: Close the session.
- `complete()`: Mark the current message as processed and resume reading.

### BaseWSPeer, PlainWSPeer, SSLWSPeer

- `BaseWSPeer` ([include/xrpl/server/detail/BaseWSPeer.h]) is a template base class implementing `WSSession`.
- `PlainWSPeer` ([include/xrpl/server/detail/PlainWSPeer.h]) and `SSLWSPeer` ([include/xrpl/server/detail/SSLWSPeer.h]) inherit from `BaseWSPeer` and implement plain and SSL WebSocket sessions, respectively.

---

## WebSocket Session Lifecycle

### run() and Handshake

- `WSSession::run()` is implemented by `BaseWSPeer::run()`:

```cpp
template <class Handler, class Impl>
void BaseWSPeer<Handler, Impl>::run()
{
    if (!strand_.running_in_this_thread())
        return post(
            strand_, std::bind(&BaseWSPeer::run, impl().shared_from_this()));
    impl().ws_.set_option(port().pmd_options);

    control_callback_ = std::bind(
        &BaseWSPeer::on_ping_pong,
        this,
        std::placeholders::_1,
        std::placeholders::_2);
    impl().ws_.control_callback(control_callback_);
    start_timer();
    close_on_timer_ = true;
    impl().ws_.set_option(
        boost::beast::websocket::stream_base::decorator([](auto& res) {
            res.set(
                boost::beast::http::field::server,
                BuildInfo::getFullVersionString());
        }));
    impl().ws_.async_accept(
        request_,
        bind_executor(
            strand_,
            std::bind(
                &BaseWSPeer::on_ws_handshake,
                impl().shared_from_this(),
                std::placeholders::_1)));
}
```

- Ensures thread safety via strand.
- Sets permessage-deflate options and control callbacks.
- Starts a timer for timeouts and pings.
- Sets the `Server` HTTP header in the handshake response.
- Initiates the asynchronous WebSocket handshake.
- On handshake completion (`on_ws_handshake`), disables close-on-timer and starts reading messages.

### Reading Messages

- After handshake, `do_read()` is called to start reading WebSocket messages:

```cpp
template <class Handler, class Impl>
void BaseWSPeer<Handler, Impl>::do_read()
{
    if (!strand_.running_in_this_thread())
        return post(
            strand_,
            std::bind(&BaseWSPeer::do_read, impl().shared_from_this()));
    impl().ws_.async_read(
        rb_,
        bind_executor(
            strand_,
            std::bind(
                &BaseWSPeer::on_read,
                impl().shared_from_this(),
                std::placeholders::_1)));
}
```

- Asynchronously reads a message into the buffer `rb_`.
- On completion, `on_read` is called.

#### on_read

```cpp
template <class Handler, class Impl>
void BaseWSPeer<Handler, Impl>::on_read(error_code const& ec)
{
    if (ec == boost::beast::websocket::error::closed)
        return on_close({});
    if (ec)
        return fail(ec, "read");
    auto const& data = rb_.data();
    std::vector<boost::asio::const_buffer> b;
    b.reserve(std::distance(data.begin(), data.end()));
    std::copy(data.begin(), data.end(), std::back_inserter(b));
    this->handler_.onWSMessage(impl().shared_from_this(), b);
    rb_.consume(rb_.size());
}
```

- Handles connection closure and errors.
- Extracts the message data and calls the handler's `onWSMessage` with the session and message buffers.
- Consumes the buffer after processing.

### Message Processing and onWSMessage

- The handler's `onWSMessage` ([src/xrpld/rpc/detail/ServerHandler.cpp]) processes the incoming message:

```cpp
void ServerHandler::onWSMessage(
    std::shared_ptr<WSSession> session,
    std::vector<boost::asio::const_buffer> const& buffers)
{
    Json::Value jv;
    auto const size = boost::asio::buffer_size(buffers);
    if (size > RPC::Tuning::maxRequestSize ||
        !Json::Reader{}.parse(jv, buffers) ||
        !jv.isObject())
    {
        Json::Value jvResult(Json::objectValue);
        jvResult[jss::type] = jss::error;
        jvResult[jss::error] = "jsonInvalid";
        jvResult[jss::value] = buffers_to_string(buffers);

        boost::beast::multi_buffer sb;
        Json::stream(jvResult, [&sb](auto const p, auto const n) {
            sb.commit(boost::asio::buffer_copy(
                sb.prepare(n), boost::asio::buffer(p, n)));
        });

        JLOG(m_journal.trace()) << "Websocket sending '" << jvResult << "'";

        session->send(
            std::make_shared<StreambufWSMsg<decltype(sb)>>(std::move(sb)));
        session->complete();
        return;
    }

    JLOG(m_journal.trace()) << "Websocket received '" << jv << "'";

    auto const postResult = m_jobQueue.postCoro(
        jtCLIENT_WEBSOCKET, "WS-Client",
        [this, session, jv = std::move(jv)](
            std::shared_ptr<JobQueue::Coro> const& coro)
        {
            auto const jr = this->processSession(session, coro, jv);
            auto const s = to_string(jr);
            auto const n = s.length();
            boost::beast::multi_buffer sb(n);
            sb.commit(boost::asio::buffer_copy(
                sb.prepare(n), boost::asio::buffer(s.c_str(), n)));
            session->send(
                std::make_shared<StreambufWSMsg<decltype(sb)>>(std::move(sb)));
            session->complete();
        });

    if (postResult == nullptr)
    {
        session->close({boost::beast::websocket::going_away, "Shutting Down"});
    }
}
```

- Validates and parses the message as JSON.
- If invalid, sends an error response and returns.
- If valid, posts the message to the job queue for asynchronous processing.
- The result is sent back to the client, and `session->complete()` is called to resume reading.

### Sending Messages

- `WSSession::send` is implemented by `BaseWSPeer::send` ([include/xrpl/server/detail/BaseWSPeer.h]):

```cpp
void BaseWSPeer<Handler, Impl>::send(std::shared_ptr<WSMsg> w)
{
    if (!strand_.running_in_this_thread())
        return post(
            strand_,
            std::bind(
                &BaseWSPeer::send, impl().shared_from_this(), std::move(w)));
    if (do_close_)
        return;
    if (wq_.size() > port().ws_queue_limit)
    {
        cr_.code = safe_cast<decltype(cr_.code)>(
            boost::beast::websocket::close_code::policy_error);
        cr_.reason = "Policy error: client is too slow.";
        JLOG(this->j_.info()) << cr_.reason;
        wq_.erase(std::next(wq_.begin()), wq_.end());
        close(cr_);
        return;
    }
    wq_.emplace_back(std::move(w));
    if (wq_.size() == 1)
        on_write({});
}
```

- Ensures thread safety via strand.
- If the session is closing, returns.
- If the outgoing queue exceeds the limit, closes the session with a policy error.
- Otherwise, queues the message and starts the write process if idle.

#### Message Write Process

- `on_write` prepares and sends message chunks using the `WSMsg::prepare` interface.
- If the message is not complete, continues writing chunks.
- When the message is complete, `on_write_fin` pops it from the queue and starts the next write or closes if requested.

### Message Queueing and Flow Control

- The outgoing message queue (`wq_`) enforces a per-session limit (`port().ws_queue_limit`).
- If the client is too slow to read messages, the server closes the connection with a policy error.
- All message sending is serialized via the strand for thread safety.

### Closing and Cleanup

- `close()` and `close(reason)` initiate a graceful shutdown of the WebSocket session.
- If there are pending messages, the close is deferred until the queue is empty.
- The actual close is performed asynchronously, and `on_close` handles cleanup.

```cpp
template <class Handler, class Impl>
void BaseWSPeer<Handler, Impl>::close(boost::beast::websocket::close_reason const& reason)
{
    if (!strand_.running_in_this_thread())
        return post(strand_, [self = impl().shared_from_this(), reason] { self->close(reason); });

    if (do_close_)
        return;

    do_close_ = true;

    if (wq_.empty())
    {
        impl().ws_.async_close(
            reason,
            bind_executor(
                strand_,
                [self = impl().shared_from_this()](boost::beast::error_code const& ec) {
                    self->on_close(ec);
                }
            )
        );
    }
    else
    {
        cr_ = reason;
    }
}
```

---

## WebSocket Subscription and Notification

### WSInfoSub

- `WSInfoSub` ([src/xrpld/rpc/detail/WSInfoSub.h]) is a specialized subscription object for WebSocket sessions.
- It holds a weak pointer to the associated `WSSession` and user/forwarded-for information.
- The `send` method transmits a JSON message to the WebSocket client:

```cpp
void send(Json::Value const& jv, bool) override {
    auto sp = ws_.lock();
    if (!sp) return;
    boost::beast::multi_buffer sb;
    Json::stream(jv, [&](void const* data, std::size_t n) {
        sb.commit(boost::asio::buffer_copy(
            sb.prepare(n), boost::asio::buffer(data, n)));
    });
    auto m = std::make_shared<StreambufWSMsg<decltype(sb)>>(std::move(sb));
    sp->send(m);
}
```

- Used for real-time event delivery (e.g., ledger updates, transactions) to WebSocket clients.

---

## Integration with RPC and ServerHandler

### onHandoff and WebSocket Upgrade

- `ServerHandler::onHandoff` ([src/xrpld/rpc/detail/ServerHandler.cpp]) handles HTTP requests that may be upgraded to WebSocket:

```cpp
if (!is_ws)
    return statusRequestResponse(request, http::status::unauthorized);

std::shared_ptr<WSSession> ws;
try {
    ws = session.websocketUpgrade();
} catch (std::exception const& e) {
    JLOG(m_journal.error()) << "Exception upgrading websocket: " << e.what() << "\n";
    return statusRequestResponse( request, http::status::internal_server_error);
}

auto is{std::make_shared<WSInfoSub>(m_networkOPs, ws)};
auto const beast_remote_address =
    beast::IPAddressConversion::from_asio(remote_address);

is->getConsumer() = requestInboundEndpoint(
    m_resourceManager,
    beast_remote_address,
    requestRole(
        Role::GUEST,
        session.port(),
        Json::Value(),
        beast_remote_address,
        is->user()),
    is->user(),
    is->forwarded_for());

ws->appDefined = std::move(is);
ws->run();

Handoff handoff;
handoff.moved = true;
return handoff;
```

- If the request is a WebSocket upgrade, creates a new `WSSession`, sets up the subscription, and starts the session.

### onWSMessage and processSession

- `onWSMessage` (see above) posts the message to the job queue for processing.
- `processSession` ([src/xrpld/rpc/detail/ServerHandler.cpp]) processes the request and returns a JSON result, which is sent back to the client.

---

## Thread Safety and Asynchrony

- All asynchronous operations are dispatched on a Boost.Asio strand to ensure thread safety.
- Message sending, reading, and closing are serialized per session.
- The system is designed to handle many concurrent WebSocket sessions efficiently.

---

## References to Source Code

- [include/xrpl/server/detail/Door.h]
- [include/xrpl/server/detail/PlainHTTPPeer.h]
- [include/xrpl/server/detail/SSLHTTPPeer.h]
- [include/xrpl/server/Session.h]
- [include/xrpl/server/WSSession.h]
- [include/xrpl/server/detail/BaseWSPeer.h]
- [include/xrpl/server/detail/PlainWSPeer.h]
- [include/xrpl/server/detail/SSLWSPeer.h]
- [src/xrpld/rpc/detail/ServerHandler.cpp]
- [src/xrpld/rpc/detail/WSInfoSub.h]