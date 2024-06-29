docker-build-seed:
	docker build . -f ./Dockerfile.seed -t 1brc/seed:latest

docker-run-seed:
	docker run -v ./seed:/srv -e NUM_OF_ROWS_TO_GENERATE=$(NUM_OF_ROWS_TO_GENERATE) 1brc/seed:latest