const exec = require('child_process').exec;

function setV4L2(setting = '', value = '') {
    console.log(`v4l2-ctl -d ${this._path} -c ${setting}=${value}`);
    exec(`v4l2-ctl -d ${this._path} -c ${setting}=${value}`);
}

function setAll() {
    for (const key in settings) {
        if (key === 'white_balance_temperature' && settings['white_balance_temperature_auto'] === 1 || 
            key === 'exposure_absolute' && settings['exposure_auto'] === 3 ||
            key === 'focus_absolute' && settings['focus_auto'] === 1) {

            } else {
                setV4L2.call(this, key, settings[key]);
            }
    }
}

const settings = {
    brightness: 128,
    contrast: 128,
    saturation: 128,
    white_balance_temperature_auto: 1,
    // gain: 0,
    // power_line_frequency: 2,
    white_balance_temperature: 4000,
    sharpness: 128,
    // backlight_compensation: 0,
    // exposure_auto: 3,
    // exposure_absolute: 250,
    // exposure_auto_priority: 0,
    // pan_absolute: 0,
    // tilt_absolute: 0,
    focus_absolute: 0,
    focus_auto: 1,
    zoom_absolute: 100,
};

function WebcamConstructor(path = '/dev/video0') {
    this._path = path;
    
    setAll.call(this);

    Object.defineProperty(this, 'brightness', {
        get() {
            return settings.brightness;
        },
        set(value = 128) {
            if (parseInt(value) >= 0 && parseInt(value) <= 255) {
                settings.brightness = parseInt(value);
                setV4L2.call(this, 'brightness', settings.brightness);
            }
        }
    });

    Object.defineProperty(this, 'contrast', {
        get() {
            return settings.contrast;
        },
        set(value = 128) {
            if (parseInt(value) >= 0 && parseInt(value) <= 255) {
                settings.contrast = parseInt(value);
                setV4L2.call(this, 'contrast', settings.contrast);
            }
        }
    });

    Object.defineProperty(this, 'saturation', {
        get() {
            return settings.saturation;
        },
        set(value = 128) {
            if (parseInt(value) >= 0 && parseInt(value) <= 255) {
                settings.saturation = parseInt(value);
                setV4L2.call(this, 'saturation', settings.saturation);
            }
        }
    });

    Object.defineProperty(this, 'sharpness', {
        get() {
            return settings.sharpness;
        },
        set(value = 128) {
            if (parseInt(value) >= 0 && parseInt(value) <= 255) {
                settings.sharpness = parseInt(value);
                setV4L2.call(this, 'sharpness', settings.sharpness);
            }
        }
    });

    Object.defineProperty(this, 'white_balance_temperature_auto', {
        get() {
            return settings.white_balance_temperature_auto;
        },
        set(value = 1) {
            if (parseInt(value) >= 0 && parseInt(value) <= 1) {
                settings.white_balance_temperature_auto = parseInt(value);
                setV4L2.call(this, 'white_balance_temperature_auto', settings.white_balance_temperature_auto);
            }
        }
    });

    Object.defineProperty(this, 'white_balance_temperature', {
        get() {
            return settings.white_balance_temperature;
        },
        set(value = 4000) {
            if (parseInt(value) >= 2000 && parseInt(value) <= 7500) {
                settings.white_balance_temperature = parseInt(value);
                setV4L2.call(this, 'white_balance_temperature', settings.white_balance_temperature);
            }
        }
    });

    Object.defineProperty(this, 'focus_auto', {
        get() {
            return settings.focus_auto;
        },
        set(value = 1) {
            if (parseInt(value) == 0 || parseInt(value) == 1) {
                settings.focus_auto = parseInt(value);
                setV4L2.call(this, 'focus_auto', settings.focus_auto);
            }
        }
    });

    Object.defineProperty(this, 'focus_absolute', {
        get() {
            return settings.focus_absolute;
        },
        set(value = 0) {
            if (parseInt(value) >= 0 && parseInt(value) <= 255 && settings.focus_auto === 0) {
                settings.focus_absolute = parseInt(value);
                setV4L2.call(this, 'focus_absolute', settings.focus_absolute);
            }
        }
    });

    Object.defineProperty(this, 'zoom_absolute', {
        get() {
            return settings.zoom_absolute;
        },
        set(value = 100) {
            if (parseInt(value) >= 100 && parseInt(value) <= 400) {
                settings.zoom_absolute = parseInt(value);
                setV4L2.call(this, 'zoom_absolute', settings.zoom_absolute);
            }
        }
    });

}

module.exports = WebcamConstructor;
