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
	-v $(BRC_DATA_DIR):/srv \
	-e BRC_NUM_OF_ROWS=$(BRC_NUM_OF_ROWS) \
	-e BRC_FILENAME=$(BRC_FILENAME) \
	1brc/generator:latest

aggregate:
	docker run \
	-v $(BRC_FILEPATH):$(BRC_FILEPATH) \
	-e BRC_LOG_LEVEL=$(BRC_LOG_LEVEL) \
	-e BRC_FILEPATH=$(BRC_FILEPATH) \
	-t 1brc/aggregator:latest