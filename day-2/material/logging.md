# XRPL Logging Guide

## Table of Contents

1. Introduction
2. Logging Basics
3. Log Severity Levels
4. Log Message Formatting and Output
   - Console Output
   - Log Message Truncation
   - Sensitive Data Scrubbing
   - Concrete Output Examples
5. Log File Management and Rotation
   - Log File Directory Creation and Error Handling
   - Log Rotation in Other Components
7. Integration with Application Modules
   - Use of JLOG in Practice
   - Debug Logging in Error Handling
   - Integration with beast::Journal
8. Fallback: Using debugLog and Log.h
9. Logging in Tests
10. References to Source Code

---

## 1. Introduction

XRPL (XRP Ledger) uses a robust logging system to help developers monitor, debug, and analyze the behavior of the software. The system is based on the `JLOG` macro and `beast::Journal` objects, with support for multiple output sinks, severity levels, and log file management.

---

## 2. Logging Basics

To log messages in XRPL, you typically use the `JLOG` macro with a `beast::Journal` object. This allows you to specify the severity and content of your log messages.

**Example:**
```cpp
#include <xrpl/basics/Log.h>

// Log a debug message
JLOG(journal_.debug()) << "This is a debug message";

// Log a warning
JLOG(journal_.warn()) << "Something unexpected happened";

// Log an error
JLOG(journal_.error()) << "An error occurred: " << errorMsg;
```

---

## 3. Log Severity Levels

XRPL supports several log severity levels, which control the verbosity and importance of log messages:

- `trace()`
- `debug()`
- `info()`
- `warn()`
- `error()`
- `fatal()`

These correspond to increasing levels of severity, from detailed tracing to fatal errors.

---

## 4. Log Message Formatting and Output

Log messages use C++ stream syntax, allowing you to concatenate strings, numbers, and other types.

**Example:**
```cpp
JLOG(journal.info()) << "Transaction " << txid << " succeeded.";
```

### Console Output

Logs can be output to the console, especially in development or for certain severities.

### Log Message Truncation

If a log message is too long, it may be truncated to prevent excessive output.

### Sensitive Data Scrubbing

Sensitive data should be scrubbed or omitted from logs to avoid leaks.

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

## 5. Log File Management and Rotation

Log files are written to a configurable directory. The system supports:

- Directory creation and error handling
- Log file rotation to prevent unbounded growth

### Log File Directory Creation and Error Handling

If the log directory cannot be created, errors are logged and handled gracefully.

### Log Rotation in Other Components

Other components may also implement log rotation as needed.

## 6. Integration with Application Modules

### Use of JLOG in Practice

Obtain a `beast::Journal` from the application or component, and use `JLOG` to log messages.

**Example:**
```cpp
void doSomething(beast::Journal& j)
{
    JLOG(j.info()) << "Starting operation";
    // ... do work ...
    JLOG(j.debug()) << "Operation details: " << details;
}
```

## 7. Fallback: Using debugLog and Log.h

If you do not have a `JLOG` macro or a `beast::Journal` object, you can use the global debug journal via `debugLog()`.

**Include the header:**
```cpp
#include <xrpl/basics/Log.h>
```

**Example usage:**
```cpp
JLOG(debugLog().warn()) << "This is a warning message";
JLOG(debugLog().fatal()) << "A fatal error occurred";
```

**Full example:**
```cpp
#include <xrpl/basics/Log.h>

void myFunction() {
    JLOG(debugLog().info()) << "Fallback logging in action.";
}
```

---

## 9. Logging in Tests

You can control the log level in your test environment to adjust output verbosity.

### Setting Log Level in Tests

Set the log level in the `test::jtx::Env` constructor:

```cpp
// Set log level to TRACE for detailed output
test::jtx::Env env{
    *this,
    envconfig(),
    nullptr,
    beast::severities::kTrace
};
```

**Other log levels:**
- `kTrace`
- `kDebug`
- `kInfo`
- `kWarning`
- `kError`
- `kFatal`

### Example: Running Tests with More Logging

To see more log output, use `kTrace` or `kDebug` as shown above.

---

## 10. References to Source Code

- [xrpl/basics/Log.h](https://github.com/XRPLF/rippled/blob/develop/src/ripple/basics/Log.h)
- [xrpl/beast/utility/Journal.h](https://github.com/XRPLF/rippled/blob/develop/src/beast/beast/utility/Journal.h)
- [xrpl/basics/Log.cpp](https://github.com/XRPLF/rippled/blob/develop/src/ripple/basics/Log.cpp)
- [xrpld/app/main/Application.h](https://github.com/XRPLF/rippled/blob/develop/src/ripple/app/main/Application.h)
- [xrpld/rpc/handlers/LogLevel.cpp](https://github.com/XRPLF/rippled/blob/develop/src/ripple/rpc/handlers/LogLevel.cpp)


cmake --build . --target rippled --parallel 10 && ./rippled -u ripple.app.AMM