# Testing

You can run tests with:

npm run test

If we are not making changes to the heaps you do not need to run those tests and can run:

COVERAGE_THRESHOLD=false npm run test terra-route.compare.spec.ts terra-route.spec.ts

Here the COVERAGE_THRESHOLD environment variable will disable code coverage thresholds so tests do not explicitly fail when not running the full test suite.

You can assume unit tests are already passing when a new conversation starts, and do not need to run them until your changes are made. You should not need to make any changes to the unit test files (.spec.ts files) unless there are significant changes to the public behavior of the code or you are explicitly requested to. The Terra Route API should not change unless specifically requested. You do not need to run tests when making changes to Markdown files.

The test file terra-route.compare.spec.ts is used to check the TerraRoute class implementation against another implementation, geojson-path-finder. This is to avoid regressions. This line in terra-route.compare.spec.ts is correct and should not be changed in an attempt to make tests pass:

expect(terraRouteLength).toBeLessThanOrEqual(pathFinderLength);

Assume that the implementation is wrong if this expectation fails.

# Benchmarking

Terra Route is designed to be a high-performance GeoJSON routing library. You can run a series of benchmarks with the following command:

npm run benchmark:loop

This will run the benchmark tool 8 times - we want to make sure there is no regressions when reducing complexity. 

The output will write out 8 lines in the following format:

Terra Route took 148ms to route 100 point pairs

Before making changes to the source code, ensure that you run this first to get a comparison for future changes that are made. There should never be significant performance regressions.

# Installing and Dependencies

Terra Route is a standalone library and does not have any external dependencies, except for development. You should not need to install any additional dependencies.

# Code style

- Avoid single letters or abbreviations for variable names
- Prefer early returns or continues to reduce nesting
- Avoid single line if, else if and else statements
- When typing GeoJSON objects, use types from @types/geojson i.e. import { Feature } from "geojson";
