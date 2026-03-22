/**
 * Concept content data for the glossary.
 *
 * All 11 core concepts are explained using language a smart 10-14 year old
 * would understand, with references to piano, violin, and real-world sound.
 */

import type { ConceptEntry } from '../types/ui'

/** All glossary concepts for the application. */
export const CONCEPTS: ConceptEntry[] = [
  {
    id: 'frequency',
    title: 'Frequency',
    shortDescription:
      'How fast a sound wave vibrates, measured in cycles per second (Hertz).',
    fullExplanation:
      'Frequency tells you how many times a wave wiggles back and forth in one second. We measure it in Hertz (Hz). A wave that vibrates 440 times per second is 440 Hz — that is the A note above middle C on a piano.\n\nHigher frequency means a higher-pitched sound. The keys on the right side of a piano play higher frequencies than the keys on the left. A violin\'s thinnest string vibrates faster (higher frequency) than its thickest string, which is why it sounds higher.\n\nWhen you double the frequency, you go up exactly one octave. So 440 Hz (A4) doubled is 880 Hz (A5) — the same note, just higher.',
    relatedConcepts: ['amplitude', 'wavelength', 'harmonics'],
  },
  {
    id: 'amplitude',
    title: 'Amplitude',
    shortDescription:
      'How tall a wave is — it controls how loud or quiet a sound is.',
    fullExplanation:
      'Amplitude is the height of a wave from its resting position to its peak. Bigger amplitude means louder sound; smaller amplitude means quieter sound.\n\nImagine plucking a guitar string gently versus hard. A hard pluck moves the string farther from its resting spot, creating a wave with bigger amplitude and a louder sound. A gentle pluck creates a smaller wave and a softer sound.\n\nIn our app, amplitude goes from 0 (silent) to 1 (full volume). It does not change the pitch at all — only how loud the sound is.',
    relatedConcepts: ['frequency', 'waveform-types'],
  },
  {
    id: 'phase',
    title: 'Phase',
    shortDescription:
      'Where a wave starts in its cycle, like choosing where to jump onto a merry-go-round.',
    fullExplanation:
      'Phase describes the starting position of a wave. Think of two people jumping rope with the same speed: if they start at the same moment, their ropes move together (in phase). If one starts a half-beat later, the ropes move opposite to each other (out of phase).\n\nPhase is measured in degrees (0° to 360°) or radians (0 to 2π). A phase shift of 180° (or π radians) flips the wave upside down.\n\nPhase matters most when you combine waves. Two identical waves perfectly in phase add up to a wave twice as tall. The same two waves at 180° apart cancel each other out completely!',
    relatedConcepts: ['superposition', 'interference'],
  },
  {
    id: 'wavelength',
    title: 'Wavelength',
    shortDescription:
      'The distance from one wave peak to the next — longer wavelengths mean lower-pitched sounds.',
    fullExplanation:
      'Wavelength is the physical distance between two identical points on a wave, like from one peak to the next peak. It is closely related to frequency: high-frequency waves have short wavelengths, and low-frequency waves have long wavelengths.\n\nSound travels at about 343 meters per second in air. A 440 Hz tone (A above middle C) has a wavelength of about 0.78 meters — a bit longer than a ruler. A deep bass note at 50 Hz has a wavelength of almost 7 meters!\n\nOn a piano, the lowest notes have the longest wavelengths. That is partly why grand pianos are so big — those long bass strings need room to vibrate.',
    relatedConcepts: ['frequency'],
  },
  {
    id: 'waveform-types',
    title: 'Waveform Types',
    shortDescription:
      'The shape of a wave — sine, square, triangle, and sawtooth each have a unique sound character.',
    fullExplanation:
      'A waveform is the shape of a sound wave. Different shapes produce different timbres (tone colors), even at the same pitch and volume.\n\nA sine wave is the purest, smoothest sound — like a tuning fork or a flute playing softly. A square wave sounds buzzy and hollow, like an old video game. A triangle wave is softer than a square but still has some edge. A sawtooth wave is bright and buzzy, similar to a violin or brass instrument.\n\nThe reason they sound different is that each shape contains a different mix of harmonics. A sine wave has only one frequency. Square, triangle, and sawtooth waves are actually made up of many sine waves layered together — which is exactly what Fourier transforms reveal!',
    relatedConcepts: ['harmonics', 'superposition', 'fft'],
  },
  {
    id: 'superposition',
    title: 'Superposition',
    shortDescription:
      'When waves overlap, their values simply add together at every point.',
    fullExplanation:
      'Superposition means that when two or more waves exist in the same space, the result is just the sum of all the individual waves at each moment in time. This is how sound works in real life — when a piano and violin play together, your ear receives one combined wave that is the sum of both instruments.\n\nThis is the key idea behind Fourier transforms: any complex wave can be broken down into a sum of simple sine waves. And the reverse is also true — you can build any wave shape by adding sine waves of different frequencies, amplitudes, and phases together.\n\nIn this app, each track is a single wave, and what you hear is all of them superimposed — added together into one combined signal.',
    relatedConcepts: ['interference', 'fft', 'harmonics'],
  },
  {
    id: 'interference',
    title: 'Constructive & Destructive Interference',
    shortDescription:
      'Waves can build each other up (constructive) or cancel each other out (destructive).',
    fullExplanation:
      'When two waves overlap, they interfere with each other. If their peaks line up, they add together and make a bigger wave — this is constructive interference. If one wave\'s peak lines up with the other\'s valley, they cancel out — this is destructive interference.\n\nNoise-canceling headphones use destructive interference! They listen to outside noise and play the exact opposite wave, canceling the sound.\n\nYou can see this in the app by creating two sine waves with the same frequency. When they are in phase (phase = 0), the combined wave is twice as tall. Shift one by 180° and they cancel to silence. Anything in between gives you a partially combined wave.',
    relatedConcepts: ['phase', 'superposition'],
  },
  {
    id: 'harmonics',
    title: 'Harmonics & Overtones',
    shortDescription:
      'Extra higher-pitched frequencies that naturally ring along with a base note, giving instruments their unique sound.',
    fullExplanation:
      'When you pluck a violin string or press a piano key, you do not just hear one frequency. The string vibrates at its base frequency (the fundamental) plus many higher frequencies called harmonics. The harmonics are whole-number multiples of the fundamental: if the fundamental is 200 Hz, the harmonics are 400 Hz, 600 Hz, 800 Hz, and so on.\n\nHarmonics are the reason a piano and a violin can play the same note but sound completely different. Both produce the same fundamental frequency, but each instrument has a different mix of harmonics — a different recipe of overtones.\n\nA square wave, for example, contains only the odd harmonics (1st, 3rd, 5th, 7th...). A sawtooth wave contains all harmonics. A pure sine wave has no harmonics at all — just the fundamental.',
    relatedConcepts: ['frequency', 'waveform-types', 'fft'],
  },
  {
    id: 'time-vs-frequency-domain',
    title: 'Time Domain vs Frequency Domain',
    shortDescription:
      'Two different ways to look at the same sound — as a waveform over time, or as a list of frequencies.',
    fullExplanation:
      'The time domain shows you what a wave looks like over time — the wiggly line you see on the left side of this app. It tells you the exact value of the wave at every moment, but it is hard to tell which frequencies are mixed together just by looking at it.\n\nThe frequency domain shows you which frequencies are present and how strong each one is — that is the bar chart on the right side. Each spike represents a frequency that is part of the sound. It is easy to read, but it does not tell you about timing.\n\nA Fourier Transform is the math that converts between these two views. The time domain and frequency domain contain the same information, just displayed differently — like the same story told in two languages.',
    relatedConcepts: ['fft', 'frequency', 'superposition'],
  },
  {
    id: 'fft',
    title: 'FFT (Fast Fourier Transform)',
    shortDescription:
      'A clever algorithm that quickly figures out which frequencies are hiding inside a complex wave.',
    fullExplanation:
      'The Fast Fourier Transform (FFT) is a speedy recipe for breaking a complex wave into its individual sine-wave ingredients. It takes a signal from the time domain (wiggly waveform) and converts it into the frequency domain (a list of frequencies and their strengths).\n\nImagine hearing a chord on a piano — three notes at once. Your ear hears one combined sound, but your brain somehow figures out the individual notes. The FFT does the same thing, but with math. It is used everywhere: music apps, voice recognition, medical imaging, even earthquake detection.\n\nThe "Fast" part matters because the original Fourier Transform is slow for large amounts of data. The FFT is a shortcut that gives the same answer much, much faster — fast enough to analyze sound in real time, which is how this app can show you the frequency chart updating live as you change waves.',
    relatedConcepts: ['time-vs-frequency-domain', 'frequency', 'nyquist'],
  },
  {
    id: 'nyquist',
    title: 'Nyquist & Sampling',
    shortDescription:
      'To capture a sound digitally, you need to sample it at least twice as fast as its highest frequency.',
    fullExplanation:
      'Computers work with numbers, not continuous waves. To turn a sound wave into digital data, we take snapshots of the wave\'s value many times per second — this is called sampling. The number of snapshots per second is the sample rate. CD-quality audio uses 44,100 samples per second (44.1 kHz).\n\nThe Nyquist theorem says you need at least 2 samples per cycle to capture a frequency. So at 44.1 kHz, the highest frequency you can capture is about 22,050 Hz. Luckily, human hearing tops out around 20,000 Hz, so that works perfectly.\n\nIf you try to record a frequency higher than half your sample rate, something weird happens: it shows up as a fake lower frequency called an alias. This is like a wagon wheel in a movie appearing to spin backwards — the camera is not taking enough frames to capture the true motion.',
    relatedConcepts: ['frequency', 'fft'],
  },
]

/**
 * Finds a concept by its ID.
 *
 * @param id - The concept ID to search for.
 * @returns The matching ConceptEntry, or undefined if not found.
 */
export function findConceptById(id: string): ConceptEntry | undefined {
  return CONCEPTS.find((concept) => concept.id === id)
}

/**
 * Filters concepts whose title or short description matches a search query.
 *
 * @param query - The search string (case-insensitive).
 * @returns An array of matching ConceptEntry items.
 */
export function searchConcepts(query: string): ConceptEntry[] {
  const lowerQuery = query.toLowerCase().trim()
  if (lowerQuery === '') {
    return CONCEPTS
  }
  return CONCEPTS.filter(
    (concept) =>
      concept.title.toLowerCase().includes(lowerQuery) ||
      concept.shortDescription.toLowerCase().includes(lowerQuery),
  )
}
