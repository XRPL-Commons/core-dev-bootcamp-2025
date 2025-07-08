# XRPL Logging Functionality and Architecture: Comprehensive Lesson Plan

This document provides a detailed, code-based breakdown of the logging infrastructure in the XRPL (XRP Ledger) source code. It covers every aspect of logging, including its architecture, log sinks, severity levels, file and console output, thread safety, log rotation, debug logging, integration with application modules, and performance logging. All explanations are strictly grounded in the provided source code and documentation.

---

## Table of Contents

- [Logging Overview](#logging-overview)
- [Log Severity Levels](#log-severity-levels)
- [Core Logging Classes and Structure](#core-logging-classes-and-structure)
  - [Logs](#logs)
  - [Sink](#sink)
  - [File](#file)
  - [DebugSink and DebugLog](#debugsink-and-debuglog)
  - [Macros: JLOG and CLOG](#macros-jlog-and-clog)
- [Log Message Formatting and Output](#log-message-formatting-and-output)
  - [Console Output](#console-output)
  - [Log Message Truncation](#log-message-truncation)
  - [Sensitive Data Scrubbing](#sensitive-data-scrubbing)
  - [Concrete Output Examples](#concrete-output-examples)
- [Log Sinks and Partitions](#log-sinks-and-partitions)
  - [Partition-Specific Thresholds](#partition-specific-thresholds)
- [Log File Management and Rotation](#log-file-management-and-rotation)
  - [Log File Directory Creation and Error Handling](#log-file-directory-creation-and-error-handling)
  - [Log Rotation in Other Components](#log-rotation-in-other-components)
- [Thread Safety](#thread-safety)
  - [Thread Safety in PerfLogImp](#thread-safety-in-perflogimp)
- [Performance Logging (PerfLog)](#performance-logging-perflog)
  - [Performance Log Configuration](#performance-log-configuration)
- [Integration with Application Modules](#integration-with-application-modules)
  - [Use of JLOG in Practice](#use-of-jlog-in-practice)
  - [Debug Logging in Error Handling](#debug-logging-in-error-handling)
  - [Integration with beast::Journal](#integration-with-beastjournal)
- [References to Source Code](#references-to-source-code)

---

## Logging Overview

- Logging in XRPL is a cross-cutting concern, used for debugging, monitoring, auditing, and error reporting throughout the codebase.
- The logging system is modular, thread-safe, and flexible, supporting multiple log destinations (sinks), severity levels, and dynamic configuration.
- Logging is abstracted via interfaces and classes, with implementation details hidden from most modules.

---

## Log Severity Levels

Defined in [`LogSeverity`](src/xrpl/basics/Log.h):

- `lsINVALID`
- `lsTRACE`
- `lsDEBUG`
- `lsINFO`
- `lsWARNING`
- `lsERROR`
- `lsFATAL`

These map to the underlying `beast::severities::Severity` and are used to filter log messages by importance.

---

## Core Logging Classes and Structure

### Logs

Defined in [`Logs`](src/xrpl/basics/Log.h):

- Central manager for all logging in the application.
- Manages log sinks (destinations), log file handling, and severity thresholds.
- Provides thread-safe access to log sinks via mutexes.
- Supports log file rotation and dynamic adjustment of log thresholds.
- Maintains a map of sinks, each associated with a partition name (e.g., "LedgerMaster", "LoadMonitor").

Key methods:
- `open(boost::filesystem::path const& pathToLogFile)`: Opens the log file.
- `get(std::string const& name)`: Returns a reference to the sink for a given partition.
- `operator[](std::string const& name)`: Same as `get`.
- `journal(std::string const& name)`: Returns a `beast::Journal` for the partition.
- `threshold() const`: Returns the current global log threshold.
- `rotate()`: Rotates the log file.

### Sink

Defined as a nested class in [`Logs`](src/xrpl/basics/Log.h):

- Inherits from `beast::Journal::Sink`.
- Represents a log destination for a specific partition.
- Filters messages by severity threshold.
- Forwards log messages to the `Logs` manager for formatting and output.
- Methods:
  - `write(beast::severities::Severity level, std::string const& text)`: Writes a log message if above threshold.
  - `writeAlways(beast::severities::Severity level, std::string const& text)`: Writes a log message regardless of threshold.

### File

Defined as a nested class in [`Logs`](src/xrpl/basics/Log.h):

- Manages log file operations.
- Methods:
  - `isOpen() const noexcept`: Checks if the log file is open.
  - `open(boost::filesystem::path const& path)`: Opens the log file.
  - `closeAndReopen()`: Closes and reopens the log file (for rotation).
  - `close()`: Closes the log file.
  - `write(char const* text)`, `writeln(char const* text)`: Writes to the log file.

### DebugSink and DebugLog

Defined in [`Log.cpp`](src/libxrpl/basics/Log.cpp):

- `DebugSink` is a singleton that allows dynamic replacement and retrieval of a debug log sink.
- `setDebugLogSink(std::unique_ptr<beast::Journal::Sink> sink)`: Sets the debug log sink.
- `debugLog()`: Returns a `beast::Journal` for debug logging.
- Used for logging in contexts where a partitioned sink is not available.

### Macros: JLOG and CLOG

Defined in [`Log.h`](src/xrpl/basics/Log.h):

- `JLOG(x)`: Utility macro for logging; only logs if the stream is active.
- `CLOG(ss)`: Utility macro for conditional logging; only logs if the stream is active.

Example usage:
```cpp
JLOG(journal_.warn()) << "Server stalled for " << timeSpentStalled.count() << " seconds.";
```

---

## Log Message Formatting and Output

Implemented in [`Log.cpp`](src/libxrpl/basics/Log.cpp):

- Log messages are formatted with timestamps, severity levels, and partition names.
- Sensitive information (e.g., seeds, passphrases) is scrubbed from output.
- Messages are truncated if they exceed a maximum length.
- Example format:
  ```
  2024-06-01T12:34:56Z LedgerMaster:WRN Server stalled for 10 seconds.
  ```

- The `Logs::format` method handles formatting and scrubbing.

### Console Output

- Log sinks can be configured to output to the console in addition to files.
- The `beast::Journal::Sink` base class supports a `console()` method to determine if console output is enabled.
- Console output is controlled per sink (partition) and can be toggled as needed.

### Log Message Truncation

- If a log message exceeds a maximum length (`maximumMessageCharacters`), it is truncated and an ellipsis (`...`) is appended.
- This is handled in `Logs::format`.

### Sensitive Data Scrubbing

- The log formatter scrubs sensitive tokens (such as seeds and passphrases) from output before writing.
- This is performed in the `Logs::format` method using a scrubber lambda.

### Concrete Output Examples

- Example log output (file or console):
  ```
  2024-06-01T12:34:56Z LedgerMaster:WRN Server stalled for 10 seconds.
  ```
- Example of a truncated message:
  ```
  2024-06-01T12:34:56Z Partition:ERR [truncated message...]
  ```

---

## Log Sinks and Partitions

- Each log message is associated with a partition (e.g., "LedgerMaster", "LoadMonitor").
- Partitions allow for fine-grained control over log output and filtering.
- Sinks are managed in a map keyed by partition name.
- The `Logs` class provides methods to retrieve or create sinks for partitions.

### Partition-Specific Thresholds

- Each partition (sink) can have its own severity threshold, allowing selective verbosity.
- The `partition_severities()` method returns the current severity for each partition.
- The `log_level` RPC command can be used to query or set partition-specific log levels.

---

## Log File Management and Rotation

- Log files are managed by the `Logs::File` class.
- Log rotation is supported via the `rotate()` method.
- The `doLogRotate` RPC handler ([LogRotate.cpp](src/xrpld/rpc/handlers/LogRotate.cpp)) allows log rotation to be triggered via RPC:
  ```cpp
  context.app.getPerfLog().rotate();
  return RPC::makeObjectValue(context.app.logs().rotate());
  ```

### Log File Directory Creation and Error Handling

- When opening a log file, the directory is created if it does not exist.
- If directory creation fails, a fatal log message is written and the application is signaled to stop.
- If the log file cannot be opened, a fatal log message is written and the application is signaled to stop.

### Log Rotation in Other Components

- Log rotation is also supported in the performance logger (`PerfLogImp`) and in database backends (e.g., `DatabaseRotatingImp`).
- The `rotate()` method is called on these components as part of the log rotation process.

---

## Thread Safety

- All access to sinks and log file operations is protected by mutexes.
- The `Logs` class uses a `std::mutex` to guard its internal state.
- The `DebugSink` singleton uses its own mutex for thread-safe replacement and retrieval.

### Thread Safety in PerfLogImp

- The `PerfLogImp` class uses mutexes and the `Locked` template to protect access to counters and internal state.
- The logging thread and condition variables are used to coordinate periodic reporting and safe shutdown.
- All updates to performance counters and log file operations are thread-safe.

---

## Performance Logging (PerfLog)

Defined in [`PerfLog.h`](src/xrpld/perflog/PerfLog.h) and implemented in [`PerfLogImp.cpp`](src/xrpld/perflog/detail/PerfLogImp.cpp):

- `PerfLog` is an interface for performance logging, tracking RPC calls and job queue activities.
- `PerfLogImp` implements the interface, maintaining counters for started, finished, and errored RPCs and jobs.
- Performance logs are written to a separate file, managed by `PerfLogImp`.
- Log rotation and reporting are supported.
- Methods include:
  - `rpcStart`, `rpcFinish`, `rpcError`: Track RPC lifecycle.
  - `jobQueue`, `jobStart`, `jobFinish`: Track job queue activity.
  - `countersJson`, `currentJson`: Report statistics as JSON.
  - `rotate()`: Rotate the performance log file.

- The performance logger runs in its own thread, periodically writing reports.

### Performance Log Configuration

- The performance log file path and logging interval are configured via the `PerfLog::Setup` struct.
- The log file path is resolved relative to the config directory if not absolute.
- If the log file directory does not exist, it is created; errors are logged and the application is stopped if creation fails.

---

## Integration with Application Modules

- Logging is included in all major modules via `#include <xrpl/basics/Log.h>`.
- Example modules using logging:
  - Ledger management (`LedgerMaster`, `LedgerHistory`)
  - Consensus (`RCLConsensus`)
  - Network operations (`NetworkOPs`)
  - Transaction processing
  - Database backends
  - Resource management
  - Performance logging

- Logging is used for:
  - Debugging and tracing execution
  - Reporting errors and warnings
  - Auditing significant events
  - Instrumentation and performance monitoring

### Use of JLOG in Practice

- The `JLOG` macro is used to log messages at various severity levels, only if the stream is active.
- Example usages:
  ```cpp
  JLOG(journal_.debug()) << "Loading specified Ledger";
  JLOG(journal_.warn()) << "Server stalled for " << timeSpentStalled.count() << " seconds.";
  JLOG(journal_.fatal()) << "Unable to open performance log " << setup_.perfLog << ".";
  ```

### Debug Logging in Error Handling

- The `debugLog()` function provides a global debug journal for logging in error handling contexts.
- Example:
  ```cpp
  JLOG(debugLog().warn()) << title;
  JLOG(debugLog().fatal()) << s;
  ```

### Integration with beast::Journal

- The logging system is built on top of `beast::Journal`, which provides stream-like logging interfaces.
- Each partitioned sink is a `beast::Journal::Sink`, and log messages are composed using `beast::Journal` streams.
- The `JLOG` macro and direct use of `journal.debug()`, `journal.warn()`, etc., are all based on `beast::Journal`.

---

## References to Source Code

- [Log.h](src/xrpl/basics/Log.h)
- [Log.cpp](src/libxrpl/basics/Log.cpp)
- [PerfLog.h](src/xrpld/perflog/PerfLog.h)
- [PerfLogImp.h](src/xrpld/perflog/detail/PerfLogImp.h)
- [PerfLogImp.cpp](src/xrpld/perflog/detail/PerfLogImp.cpp)
- [LogRotate.cpp](src/xrpld/rpc/handlers/LogRotate.cpp)
- [LedgerHistory.cpp](src/xrpld/app/ledger/LedgerHistory.cpp)
- [Application.cpp](src/xrpld/app/main/Application.cpp)
- [NetworkOPs.cpp](src/xrpld/app/misc/NetworkOPs.cpp)
- [JobTypeData.h](src/xrpld/core/JobTypeData.h)
- [beast/utility/Journal.h](src/xrpl/beast/utility/Journal.h)