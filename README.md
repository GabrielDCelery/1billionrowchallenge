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
# Example use

$ brc_num_of_rows_to_generate=100000 # Or 1000000000 if you want to go for the lot
$ brc_host_weather_station_data_folder=$(mktemp -d)
$ brc_host_weather_station_data_file_name=weatherdata.txt # You can call this anything but have .txt extension

$ brc_host_weather_station_data_folder=$brc_host_weather_station_data_folder brc_host_weather_station_data_file_name=$brc_host_weather_station_data_file_name brc_num_of_rows_to_generate=$brc_num_of_rows_to_generate make generate
```

3. Run the `aggregator` container to read the txt file and aggregate the data

```sh
$ brc_docker_weather_station_data_folder=/mnt
$ brc_log_level=debug
$ brc_host_weather_station_data_folder=$brc_host_weather_station_data_folder brc_docker_weather_station_data_folder=$brc_docker_weather_station_data_folder brc_log_level=$brc_log_level brc_host_weather_station_data_file_name=$brc_host_weather_station_data_file_name make aggregate
```
