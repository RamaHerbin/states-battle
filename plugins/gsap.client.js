import { gsap } from 'gsap'
import { InertiaPlugin } from 'gsap/InertiaPlugin'
import { SplitText } from 'gsap/SplitText.js'
import { Draggable } from 'gsap/Draggable.js'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin.js'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin.js'

export default defineNuxtPlugin(() => {
	gsap.registerPlugin(InertiaPlugin, SplitText, DrawSVGPlugin, MotionPathPlugin)

	if (process.client) {
		gsap.registerPlugin(Draggable)
	}

	return {
		provide: {
			gsap,
			InertiaPlugin,
			SplitText,
			Draggable,
			MotionPathPlugin
		}
	}
})


// Import in js sfc :
// const { $gsap, $Draggable, $SplitText, $MotionPathPlugin } = useNuxtApp();
// 