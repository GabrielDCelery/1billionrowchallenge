### What is this repository for?

This is my personal take on the 1 billion row challenge where the task is to aggregate one billion rows from a text file as fast and efficiently as possible.

The original task can be found here -> [LINK](https://github.com/gunnarmorling/1brc)

##### Why JavaScript (Node.js)?

Even though this type of task naturally lends itself into using languges that are better suited for computation heavy tasks (for example `Go` or `Rust`) I wanted to take a stab at it using Javascript for two reasons.

1. Many businesses out there will have their backend services written using Node.js and won't have the luxury to shop around for developers who are experienced enough with compiled languages (or just won't want to deal with having multiple languages making up their code base)

2. Node.js itself has many tools (`streams`, `worker threads`, clever use of `buffers`) to make a task like the above one more efficient, it is just that most of the time a good chunk of JavaScript developers are not "used to" using these techniques

##### Why Typecript over plain JavaScript?

Because these days in a business environment rarely anyone will try to write mission critical code in plain JavaScript as opposed to using Typescript.

### How to run it

1. Builds the `generator` and `aggregator` containers. The `generator` will be responsible for generating the large `txt` file of weather station data. The `aggregator` will read the file and create the expected output.

```sh
make build
```

2. Run the `generator` container to generate some weather data

```sh
BRC_DATA_DIR=/tmp/1br BRC_FILENAME=weatherdata.txt BRC_NUM_OF_ROWS=1000000000 make generate
```

3. Run the `aggregator` container to read the txt file and aggregate the data

```sh
BRC_LOG_LEVEL=debug BRC_DATA_DIR=/tmp/1br BRC_FILENAME=weatherdata.txt make aggregate
```
