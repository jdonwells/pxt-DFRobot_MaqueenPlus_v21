/**
 * Custom graphic block
 */
//% weight=100 color=#0fbc11 icon="\uf067" block="MaqueenPlusV2.0andV2.1"
//% groups="['V2.1']"
namespace maqueenPlusV2 {

    //Motor selection enumeration
    export enum WhichMotor {
        //% block="left motor"
        LeftMotor,
        //% block="right motor"
        RightMotor,
        //% block="both motors"
        BothMotor,
    };

    //Motor direction enumeration selection
    export enum MotorDirection {
        //% block="forward"
        Forward,
        //% block="backward"
        Backward,
    };

    //LED light selection enumeration
    export enum WhichLed {
        //% block="left led light"
        LeftLed,
        //% block="right led light"
        RightLed,
        //% block="both led lights"
        AllLed,
    };

    //LED light switch enumeration selection
    export enum SwitchPosition {
        //% block="off"
        Close,
        //% block="on"
        Open,
    };

    //Line sensor selection
    export enum WhichLineSensor {
        //% block="left rear"
        SensorL2 = 0,
        //% block="left"
        SensorL1,
        //% block="middle"
        SensorM,
        //% block="right"
        SensorR1,
        //% block="right rear"
        SensorR2,
    };
    /**
     * Well known colors for a NeoPixel strip
     */
    export enum NeoPixelColors {
        //% block=red
        Red = 0xFF0000,
        //% block=orange
        Orange = 0xFFA500,
        //% block=yellow
        Yellow = 0xFFFF00,
        //% block=green
        Green = 0x00FF00,
        //% block=blue
        Blue = 0x0000FF,
        //% block=indigo
        Indigo = 0x4b0082,
        //% block=violet
        Violet = 0x8a2be2,
        //% block=purple
        Purple = 0xFF00FF,
        //% block=white
        White = 0xFFFFFF,
        //% block=black
        Black = 0x000000
    }
    
    export enum CarLightColors {
        //% block=red
        Red = 1,
        //% block=green
        Green = 2,
        //% block=yellow
        Yellow = 3,
        //% block=blue
        Blue = 4,
        //% block=purple
        Purple = 5,
        //% block=cyan
        Cyan = 6,
        //% block=white
        White = 7,
        //% block=black
        Black = 0
    }

    const I2CADDR = 0x10;
    // V2.0 vlaues
    const ADC0_REGISTER = 0X26;
    const ADC1_REGISTER = 0X24;
    const ADC2_REGISTER = 0X22;
    const ADC3_REGISTER = 0X20;
    const ADC4_REGISTER = 0X1E;
    let ADC_REGISTERS = [ADC0_REGISTER, ADC1_REGISTER, ADC2_REGISTER, ADC3_REGISTER, ADC4_REGISTER]
    
    const LEFT_LED_REGISTER = 0X0B;
    const RIGHT_LED_REGISTER = 0X0C;
    const LEFT_MOTOR_REGISTER = 0X00;
    const RIGHT_MOTOR_REGISTER = 0X02;
    const LINE_STATE_REGISTER = 0X1D;
    const VERSION_CNT_REGISTER = 0X32;
    const VERSION_DATA_REGISTER = 0X33;
    
    let irstate: number;
    let neopixel_buf = pins.createBuffer(16 * 3);
    for (let i = 0; i < 16 * 3; i++) {
        neopixel_buf[i] = 0
    }
    let _brightness = 255
    let state: number;

    /**
     *  Init I2C until success
     */

    //% weight=100
    //%block="initialize via I2C until success"
    export function I2CInit(): void {
        let Version_v = 0;
        pins.i2cWriteNumber(I2CADDR, 0x32, NumberFormat.Int8LE);
        Version_v = pins.i2cReadNumber(I2CADDR, NumberFormat.Int8LE);
        while (Version_v == 0) {
            basic.showLeds(`
                # . . . #
                . # . # .
                . . # . .
                . # . # .
                # . . . #
                `, 10)
            basic.pause(500)
            basic.clearScreen()
            pins.i2cWriteNumber(0x10, 0x32, NumberFormat.Int8LE);
            Version_v = pins.i2cReadNumber(I2CADDR, NumberFormat.Int8LE);
        }
        // The 2.1 version has the addresses reversed. DFRobot will not fix it.
        if (readVersion().includes("2.1")) {
            ADC_REGISTERS = [ADC4_REGISTER, ADC3_REGISTER, ADC2_REGISTER, ADC1_REGISTER, ADC0_REGISTER]
        }
        basic.showLeds(`
                . . . . .
                . . . . #
                . . . # .
                # . # . .
                . # . . .
                `, 10)
        basic.pause(500)
        basic.clearScreen()
    }

    /**
     * Control motor module running
     * @param edir   Motor direction selection enumeration
     * @param speed1  Motor speed control, eg:100
     * @param speed2  Motor speed control, eg:100
     */

    //% block="start moving %edir left speed %speed1 right speed %speed2"
    //% speed1.min=0 speed1.max=255
    //% speed2.min=0 speed2.max=255
    //% weight=99
    export function controlMotors(edir:MotorDirection, speed1:number, speed2:number):void{
        let allBuffer = pins.createBuffer(5);
        allBuffer[0] = LEFT_MOTOR_REGISTER;
        allBuffer[1] = edir;
        allBuffer[2] = speed1;
        allBuffer[3] = edir;
        allBuffer[4] = speed2;
        pins.i2cWriteBuffer(I2CADDR, allBuffer)
    }

    /**
     * Control motor module running
     * @param emotor Motor selection enumeration
     * @param edir   Motor direction selection enumeration
     * @param speed  Motor speed control, eg:100
     */

    //% block="start %emotor moving %edir at speed %speed"
    //% speed.min=0 speed.max=255
    //% weight=99
    export function controlMotor(emotor:WhichMotor, edir:MotorDirection, speed:number):void{
        switch(emotor){
            case WhichMotor.LeftMotor:
                let leftBuffer = pins.createBuffer(3);
                leftBuffer[0] = LEFT_MOTOR_REGISTER;
                leftBuffer[1] = edir;
                leftBuffer[2] = speed;
                pins.i2cWriteBuffer(I2CADDR, leftBuffer);
            break;
            case WhichMotor.RightMotor:
                let rightBuffer = pins.createBuffer(3);
                rightBuffer[0] = RIGHT_MOTOR_REGISTER;
                rightBuffer[1] = edir;
                rightBuffer[2] = speed;
                pins.i2cWriteBuffer(I2CADDR, rightBuffer);
            break;
            default:
                controlMotors(edir, speed, speed)
            break;   
        }
    }

    /**
     * Control the motor module to stop running
     * @param emotor Motor selection enumeration
     */

    //% block="stop %emotor"
    //% weight=98
    export function controlMotorStop(emotor:WhichMotor):void{
        switch (emotor) {
            case WhichMotor.LeftMotor:
                let leftBuffer = pins.createBuffer(3);
                leftBuffer[0] = LEFT_MOTOR_REGISTER;
                leftBuffer[1] = 0;
                leftBuffer[2] = 0;
                pins.i2cWriteBuffer(I2CADDR, leftBuffer);
                break;
            case WhichMotor.RightMotor:
                let rightBuffer = pins.createBuffer(3);
                rightBuffer[0] = RIGHT_MOTOR_REGISTER;
                rightBuffer[1] = 0;
                rightBuffer[2] = 0;
                pins.i2cWriteBuffer(I2CADDR, rightBuffer);
                break;
            default:
                let allBuffer = pins.createBuffer(5);
                allBuffer[0] = LEFT_MOTOR_REGISTER;
                allBuffer[1] = 0;
                allBuffer[2] = 0;
                allBuffer[3] = 0;
                allBuffer[4] = 0;
                pins.i2cWriteBuffer(I2CADDR, allBuffer)
                break;
        }
    }

    /**
     * Control left and right LED light switch module
     * @param eled LED lamp selection
     * @param eSwitch Control LED light on or off
     */

    //% block="control %eled %eSwitch"
    //% weight=97
    export function controlLED(eled:WhichLed, eSwitch:SwitchPosition):void{
        switch(eled){
            case WhichLed.LeftLed:
                let leftLedControlBuffer = pins.createBuffer(2);
                leftLedControlBuffer[0] = LEFT_LED_REGISTER;
                leftLedControlBuffer[1] = eSwitch;
                pins.i2cWriteBuffer(I2CADDR, leftLedControlBuffer);
            break;
            case WhichLed.RightLed:
                let rightLedControlBuffer = pins.createBuffer(2);
                rightLedControlBuffer[0] = RIGHT_LED_REGISTER;
                rightLedControlBuffer[1] = eSwitch;
                pins.i2cWriteBuffer(I2CADDR, rightLedControlBuffer);
            break;
            default:
                let allLedControlBuffer = pins.createBuffer(3);
                allLedControlBuffer[0] = LEFT_LED_REGISTER;
                allLedControlBuffer[1] = eSwitch;
                allLedControlBuffer[2] = eSwitch;
                pins.i2cWriteBuffer(I2CADDR, allLedControlBuffer);
            break;
        }
    }

    /**
     * Get the state of the patrol sensor
     * @param eline Select the inspection sensor enumeration
     */

    //% block="sensor %eline is on line?"
    //% weight=96
    export function readLineSensorState(eline:WhichLineSensor):boolean {
        pins.i2cWriteNumber(I2CADDR, LINE_STATE_REGISTER, NumberFormat.Int8LE);
        let data = pins.i2cReadNumber(I2CADDR, NumberFormat.Int8LE)
        let state;
        switch(eline){
            case WhichLineSensor.SensorL1: 
                state = (data & 0x08) == 0x08 ? 1 : 0; 
            break;
            case WhichLineSensor.SensorM: 
                state = (data & 0x04) == 0x04 ? 1 : 0; 
            break;
            case WhichLineSensor.SensorR1: 
                state = (data & 0x02) == 0x02 ? 1 : 0; 
            break;
            case WhichLineSensor.SensorL2: 
                state = (data & 0x10) == 0X10 ? 1 : 0; 
            break;
            default:
                state = (data & 0x01) == 0x01 ? 1 : 0;
            break;
        }
        return state == 1;
    }
    
    /**
     * The ADC data of the patrol sensor is obtained
     * @param eline Select the inspection sensor enumeration
     */

    //% block="line sensor %eline analog data"
    //% weight=95
    export function readLineSensorData(eline:WhichLineSensor):number{
        pins.i2cWriteNumber(I2CADDR, ADC_REGISTERS[eline], NumberFormat.Int8LE);
        let buffer = pins.i2cReadBuffer(I2CADDR, 2);
        let data = buffer[1] << 8 | buffer[0]
        return data;
    }
    function mydelayUs(unit: number):void{
        let i
        while((--unit)>0){
            for (i = 0; i < 1; i++) {
            } 
        }
    }
    /**
     * Acquiring ultrasonic data
     * @param trig trig pin selection enumeration, eg:DigitalPin.P13
     * @param echo echo pin selection enumeration, eg:DigitalPin.P14
     * @note fit sr04/urm10   The difference between the two is that the echo sending time is different. 
     * The sr04 sends the echo only after receiving the echo. When urm10 is triggered, it sends echo and stops after the echo
     */
    //% block="set ultrasonic sensor TRIG pin %trig ECHO pin %echo read data unit:cm"
    //% weight=94

    export function readUltrasonic(trig:DigitalPin, echo:DigitalPin):number{
        let data;
        pins.digitalWritePin(trig, 1);
        mydelayUs(10);
        pins.digitalWritePin(trig, 0)
        data = pins.pulseIn(echo, PulseValue.High, 1000 * 58);
        if(data==0) //repeat
        {
            pins.digitalWritePin(trig, 1);
            mydelayUs(10);
            pins.digitalWritePin(trig, 0);
            data = pins.pulseIn(echo, PulseValue.High, 1000 * 58)
        }
        //59.259 / ((331.5 + 0.6 * (float)(10)) * 100 / 1000000.0) // The ultrasonic velocity (cm/us) compensated by temperature
        data = data / 59.259;

        if (data <= 0)
            return 0;
        if (data > 300)
            return 300;
        return Math.round(data);
    }

    /**
     * Getting the version number
     */
    
    //% block="read version"
    //% weight=30
    //% advanced=true
    export function readVersion():string{
        let version;
        pins.i2cWriteNumber(I2CADDR, VERSION_CNT_REGISTER, NumberFormat.Int8LE);
        version = pins.i2cReadNumber(I2CADDR, NumberFormat.Int8LE);
        pins.i2cWriteNumber(I2CADDR, VERSION_DATA_REGISTER, NumberFormat.Int8LE);
         version= pins.i2cReadBuffer(I2CADDR, version);
        let versionString = version.toString();
        return versionString
    }
    
   

    /** 
    * Set the three primary color:red, green, and blue
    * @param r  , eg: 100
    * @param g  , eg: 100
    * @param b  , eg: 100
    */

    //% weight=60
    //% r.min=0 r.max=255
    //% g.min=0 g.max=255
    //% b.min=0 b.max=255
    //% block="red|%r green|%g blue|%b"
    export function rgb(r: number, g: number, b: number): number {
        return (r << 16) + (g << 8) + (b);
    }

    /**
     * The LED positions where you wish to begin and end
     * @param from  , eg: 0
     * @param to  , eg: 3
     */

    //% weight=60
    //% from.min=0 from.max=3
    //% to.min=0 to.max=3
    //% block="range from |%from with|%to leds"
    export function ledRange(from: number, to: number): number {
        return ((from) << 16) + (2 << 8) + (to);
    }
    /**
     * Gets the RGB value of a known color
    */
    //% weight=2 blockGap=8
    //% blockId="neopixel_colors" block="%color"
    //% advanced=true
    export function colors(color: NeoPixelColors): number {
        return color;
    }
    /**
     * Set the color of the specified LEDs
     * @param pin , pin to control the leds 
     * @param index  , eg: DigitalPin.P15
     * @param rgb , color
     */
    //% weight=60
    //% index.min=0 index.max=3
    //% pin.defl=DigitalPin.P15
    //% block="SET PIN|%pin RGB light |%index show color|%rgb=neopixel_colors"
    export function setIndexColor(pin:DigitalPin,index: number, rgb: number) {
        let f = index;
        let t = index;
        let r = (rgb >> 16) * (_brightness / 255);
        let g = ((rgb >> 8) & 0xFF) * (_brightness / 255);
        let b = ((rgb) & 0xFF) * (_brightness / 255);

        if (index > 15) {
            if (((index >> 8) & 0xFF) == 0x02) {
                f = index  >> 16;
                t = index  & 0xff;
            } else {
                f = 0;
                t = -1;
            }
        }
        for (let i = f; i <= t; i++) {
            neopixel_buf[i * 3 + 0] = Math.round(g)
            neopixel_buf[i * 3 + 1] = Math.round(r)
            neopixel_buf[i * 3 + 2] = Math.round(b)
        }
        ws2812b.sendBuffer(neopixel_buf, pin)

    }

    /**
     * Set the color of all RGB LEDs
     * eg: DigitalPin.P15
     * 
     * @param pin
     * @param rgb
     * 
     */

    //% weight=60
    //% pin.defl=DigitalPin.P15
    //% block=" SET PIN|%pin RGB show color|%rgb=neopixel_colors"
    export function showColor(pin:DigitalPin,rgb: number) {
        let r = (rgb >> 16) * (_brightness / 255);
        let g = ((rgb >> 8) & 0xFF) * (_brightness / 255);
        let b = ((rgb) & 0xFF) * (_brightness / 255);
        for (let i = 0; i < 16 * 3; i++) {
            if ((i % 3) == 0)
                neopixel_buf[i] = Math.round(g)
            if ((i % 3) == 1)
                neopixel_buf[i] = Math.round(r)
            if ((i % 3) == 2)
                neopixel_buf[i] = Math.round(b)
        }
        ws2812b.sendBuffer(neopixel_buf, pin)
    }

    /**
     * Set the brightness of RGB LED
     * @param brightness  , eg: 100
     */

    //% weight=70
    //% brightness.min=0 brightness.max=255
    //% block="set RGB brightness to |%brightness"
    export function setBrightness(brightness: number) {
        _brightness = brightness;
    }

    /**
     * Turn off all RGB LEDs
     * eg: DigitalPin.P15
     * 
     * @param pin, pin to control the leds
     */

    //% weight=40
    //% pin.defl=DigitalPin.P15
    //% block="Set pin|%pin clear all RGB"
    export function ledBlank(pin: DigitalPin) {
       showColor(pin,0)
    }

    /**
     * RGB LEDs display rainbow colors
     * @param pin , led control pin
     * @param startHue, start value
     * @param endHuem end value 
     */

    //% weight=50
    //% pin.defl=DigitalPin.P15
    //% startHue.defl=1
    //% endHue.defl=360
    //% startHue.min=0 startHue.max=360
    //% endHue.min=0 endHue.max=360
    //% blockId=led_rainbow block="SET PIN|%pin set RGB show rainbow color from|%startHue to|%endHue"
    export function ledRainbow(pin:DigitalPin,startHue: number, endHue: number) {
        startHue = startHue >> 0;
        endHue = endHue >> 0;
        const saturation = 100;
        const luminance = 50;
        let steps = 3 + 1;
        const direction = HueInterpolationDirection.Clockwise;

        //hue
        const h1 = startHue;
        const h2 = endHue;
        const hDistCW = ((h2 + 360) - h1) % 360;
        const hStepCW = Math.idiv((hDistCW * 100), steps);
        const hDistCCW = ((h1 + 360) - h2) % 360;
        const hStepCCW = Math.idiv(-(hDistCCW * 100), steps);
        let hStep: number;
        if (direction === HueInterpolationDirection.Clockwise) {
            hStep = hStepCW;
        } else if (direction === HueInterpolationDirection.CounterClockwise) {
            hStep = hStepCCW;
        } else {
            hStep = hDistCW < hDistCCW ? hStepCW : hStepCCW;
        }
        const h1_100 = h1 * 100; //we multiply by 100 so we keep more accurate results while doing interpolation

        //sat
        const s1 = saturation;
        const s2 = saturation;
        const sDist = s2 - s1;
        const sStep = Math.idiv(sDist, steps);
        const s1_100 = s1 * 100;

        //lum
        const l1 = luminance;
        const l2 = luminance;
        const lDist = l2 - l1;
        const lStep = Math.idiv(lDist, steps);
        const l1_100 = l1 * 100

        //interpolate
        if (steps === 1) {
            writeBuff(0, hsl(h1 + hStep, s1 + sStep, l1 + lStep))
        } else {
            writeBuff(0, hsl(startHue, saturation, luminance));
            for (let i = 1; i < steps - 1; i++) {
                const h = Math.idiv((h1_100 + i * hStep), 100) + 360;
                const s = Math.idiv((s1_100 + i * sStep), 100);
                const l = Math.idiv((l1_100 + i * lStep), 100);
                writeBuff(0 + i, hsl(h, s, l));
            }
            writeBuff(3, hsl(endHue, saturation, luminance));
        }
        ws2812b.sendBuffer(neopixel_buf, pin)
    }

    export enum HueInterpolationDirection {
        Clockwise,
        CounterClockwise,
        Shortest
    }

    function writeBuff(index: number, rgb: number) {
        let r = (rgb >> 16) * (_brightness / 255);
        let g = ((rgb >> 8) & 0xFF) * (_brightness / 255);
        let b = ((rgb) & 0xFF) * (_brightness / 255);
        neopixel_buf[index * 3 + 0] = Math.round(g)
        neopixel_buf[index * 3 + 1] = Math.round(r)
        neopixel_buf[index * 3 + 2] = Math.round(b)
    }

    function hsl(h: number, s: number, l: number): number {
        h = Math.round(h);
        s = Math.round(s);
        l = Math.round(l);

        h = h % 360;
        s = Math.clamp(0, 99, s);
        l = Math.clamp(0, 99, l);
        let c = Math.idiv((((100 - Math.abs(2 * l - 100)) * s) << 8), 10000); //chroma, [0,255]
        let h1 = Math.idiv(h, 60);//[0,6]
        let h2 = Math.idiv((h - h1 * 60) * 256, 60);//[0,255]
        let temp = Math.abs((((h1 % 2) << 8) + h2) - 256);
        let x = (c * (256 - (temp))) >> 8;//[0,255], second largest component of this color
        let r$: number;
        let g$: number;
        let b$: number;
        if (h1 == 0) {
            r$ = c; g$ = x; b$ = 0;
        } else if (h1 == 1) {
            r$ = x; g$ = c; b$ = 0;
        } else if (h1 == 2) {
            r$ = 0; g$ = c; b$ = x;
        } else if (h1 == 3) {
            r$ = 0; g$ = x; b$ = c;
        } else if (h1 == 4) {
            r$ = x; g$ = 0; b$ = c;
        } else if (h1 == 5) {
            r$ = c; g$ = 0; b$ = x;
        }
        let m = Math.idiv((Math.idiv((l * 2 << 8), 100) - c), 2);
        let r = r$ + m;
        let g = g$ + m;
        let b = b$ + m;

        return (r << 16) + (g << 8) + b;
    }
}
