build-generator-container:
	docker build . \
	-f ./docker/Dockerfile.generator \
	-t 1brc/generator:latest

build-aggregator-container:
	docker build . \
	-f ./docker/Dockerfile.aggregator \
	-t 1brc/aggregator:latest

build: build-generator-container build-aggregator-container

generate:
	docker run \
	-v $(brc_host_weather_station_data_folder):/srv \
	-e num_of_rows_to_generate=$(brc_num_of_rows_to_generate) \
	-e host_weather_data_file_name=$(brc_host_weather_station_data_file_name) \
	1brc/generator:latest

aggregate:
	docker run \
	-v $(brc_host_weather_station_data_folder):$(brc_docker_weather_station_data_folder) \
	-e log_level=$(brc_log_level) \
	-e weather_station_data_folder_path=$(brc_docker_weather_station_data_folder) \
	-e weather_station_data_file_name=$(brc_host_weather_station_data_file_name) \
	-t 1brc/aggregator:latest