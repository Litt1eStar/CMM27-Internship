// Motion's full feature set (springs, drag, layout), loaded after first render to keep the
// initial bundle small. See LazyMotion in main.jsx; components use `m` from 'motion/react-m'.
import { domMax } from 'motion/react';

export default domMax;
