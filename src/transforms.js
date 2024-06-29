const constants = require('./constants');

const transformBufferToTemperatureAsInt = (buffer) => {
    let multiplier = 1;
    let digits = [0, 0, 0];
    let pointer = 0;
    for (let i = 0, iMax = buffer.length; i < iMax; i++) {
        char = buffer[i];

        switch (char) {
            case constants.CHAR_NEGATIVE_SIGN: {
                multiplier = -1;
                continue;
            }
            case constants.CHAR_DECIMAL: {
                pointer++;
                continue;
            }
            case constants.CHAR_NUMBER_0: {
                digits[pointer] = 0;
                continue;
            }
            case constants.CHAR_NUMBER_1: {
                digits[pointer] = 1;
                continue;
            }
            case constants.CHAR_NUMBER_2: {
                digits[pointer] = 2;
                continue;
            }
            case constants.CHAR_NUMBER_3: {
                digits[pointer] = 3;
                continue;
            }
            case constants.CHAR_NUMBER_4: {
                digits[pointer] = 4;
                continue;
            }
            case constants.CHAR_NUMBER_5: {
                digits[pointer] = 5;
                continue;
            }
            case constants.CHAR_NUMBER_6: {
                digits[pointer] = 6;
                continue;
            }
            case constants.CHAR_NUMBER_7: {
                digits[pointer] = 7;
                continue;
            }
            case constants.CHAR_NUMBER_8: {
                digits[pointer] = 8;
                continue;
            }
            case constants.CHAR_NUMBER_9: {
                digits[pointer] = 9;
                continue;
            }
            default: {
                throw new Error(`Invalid char ${char}`);
            }
        }
    }

    return multiplier * (100 * digits[0] + 10 * digits[1] + digits[2]);
};

module.exports = { transformBufferToTemperatureAsInt };
