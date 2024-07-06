const transformTemperatureBufferToTemperature = (
    temperatureBuffer: Buffer
): number => {
    let final = 0;

    let pointer = 0;

    let signature = 1;

    if (temperatureBuffer[pointer] === 45) {
        pointer += 1;
        signature = -1;
    }

    final += temperatureBuffer[pointer] - 48;

    pointer += 1;

    if (temperatureBuffer[pointer] !== 46) {
        final = final * 10 + (temperatureBuffer[pointer] - 48);
        pointer += 1;
    }

    pointer += 1;

    final = final * 10 + (temperatureBuffer[pointer] - 48);

    return signature * final;
};

export default { transformTemperatureBufferToTemperature };
