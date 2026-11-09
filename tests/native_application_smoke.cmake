# Remove only this gate's generated output: stale images cannot satisfy a run.
file(REMOVE "${CAPTURE}")
execute_process(
    COMMAND "${APPLICATION}" --frames 24 --capture "${CAPTURE}"
    RESULT_VARIABLE application_status
    OUTPUT_VARIABLE application_output
    ERROR_VARIABLE application_error
    TIMEOUT 150
)
message(STATUS "${application_output}")
if(NOT "${application_status}" STREQUAL "0")
    message(FATAL_ERROR "Application capture failed (${application_status}): ${application_error}")
endif()
execute_process(
    COMMAND "${CAPTURE_CHECK}" "${CAPTURE}"
    RESULT_VARIABLE capture_status
    OUTPUT_VARIABLE capture_output
    ERROR_VARIABLE capture_error
    TIMEOUT 10
)
message(STATUS "${capture_output}")
if(NOT "${capture_status}" STREQUAL "0")
    message(FATAL_ERROR "Application capture is missing or invalid: ${capture_error}")
endif()
