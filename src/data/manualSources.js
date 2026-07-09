// Manufacturer owner-account portals where a real owner's manual PDF can be
// downloaded straight from the source — the most truthful reference there is,
// since it's not filtered through whatever a shop tells you.
export const MANUAL_SOURCES = {
  honda: {
    name: 'Honda Owners',
    url: 'https://owners.honda.com/',
    steps: [
      'Go to owners.honda.com and click "Sign Up" (or sign in if you already have an account).',
      'Add your vehicle using the VIN below — Honda will confirm it matches your car.',
      'Go to Owner\'s Manuals & Warranties for your vehicle.',
      'Download the PDF for your model year and upload it here.',
    ],
  },
  acura: {
    name: 'Acura Owners',
    url: 'https://www.acura.com/owners',
    steps: [
      'Go to acura.com/owners and create an account (or sign in).',
      'Add your vehicle by VIN.',
      'Open Owner\'s Manuals for your vehicle and download the PDF.',
      'Upload the PDF here.',
    ],
  },
  toyota: {
    name: 'Toyota Owners',
    url: 'https://www.toyota.com/owners/',
    steps: [
      'Go to toyota.com/owners and sign up (or sign in).',
      'Add your vehicle using the VIN below.',
      'Open the Owner\'s Manual & Warranty section and download the PDF.',
      'Upload the PDF here.',
    ],
  },
  lexus: {
    name: 'Lexus Owners',
    url: 'https://www.lexus.com/owners',
    steps: [
      'Go to lexus.com/owners and create an account (or sign in).',
      'Add your vehicle by VIN.',
      'Find Manuals & Guides for your vehicle and download the PDF.',
      'Upload the PDF here.',
    ],
  },
  ford: {
    name: 'FordPass / Owner Manuals',
    url: 'https://www.ford.com/support/manuals/',
    steps: [
      'Go to ford.com/support/manuals and select your vehicle by year/model or VIN.',
      'A FordPass account lets you save it to your vehicle profile, but the manual PDF itself is downloadable without signing in.',
      'Download the PDF and upload it here.',
    ],
  },
  lincoln: {
    name: 'Lincoln Owner Manuals',
    url: 'https://www.lincoln.com/support/manuals/',
    steps: [
      'Go to lincoln.com/support/manuals and select your vehicle by year/model or VIN.',
      'Download the manual PDF.',
      'Upload the PDF here.',
    ],
  },
  chevrolet: {
    name: 'myChevrolet',
    url: 'https://www.chevrolet.com/owners/manuals-guides',
    steps: [
      'Go to chevrolet.com/owners/manuals-guides.',
      'Create a myChevrolet account (or sign in) and add your vehicle by VIN.',
      'Download the owner\'s manual PDF for your model year.',
      'Upload the PDF here.',
    ],
  },
  gmc: {
    name: 'myGMC',
    url: 'https://www.gmc.com/owners/manuals-guides',
    steps: [
      'Go to gmc.com/owners/manuals-guides.',
      'Create a myGMC account (or sign in) and add your vehicle by VIN.',
      'Download the owner\'s manual PDF.',
      'Upload the PDF here.',
    ],
  },
  buick: {
    name: 'myBuick',
    url: 'https://www.buick.com/owners/manuals-guides',
    steps: [
      'Go to buick.com/owners/manuals-guides and add your vehicle by VIN.',
      'Download the owner\'s manual PDF.',
      'Upload the PDF here.',
    ],
  },
  cadillac: {
    name: 'myCadillac',
    url: 'https://www.cadillac.com/owners/manuals-guides',
    steps: [
      'Go to cadillac.com/owners/manuals-guides and add your vehicle by VIN.',
      'Download the owner\'s manual PDF.',
      'Upload the PDF here.',
    ],
  },
  nissan: {
    name: 'Nissan Owners Portal',
    url: 'https://owners.nissanusa.com/',
    steps: [
      'Go to owners.nissanusa.com and create an account (or sign in).',
      'Add your vehicle by VIN.',
      'Open Warranty & Maintenance Info to find the manual, or search "[year] [model] owner\'s manual PDF" on nissanusa.com.',
      'Upload the PDF here.',
    ],
  },
  hyundai: {
    name: 'Hyundai Owners',
    url: 'https://owners.hyundaiusa.com/',
    steps: [
      'Go to owners.hyundaiusa.com and sign up (or sign in).',
      'Add your vehicle by VIN.',
      'Download the owner\'s manual PDF from your vehicle\'s resources.',
      'Upload the PDF here.',
    ],
  },
  kia: {
    name: 'Kia Owners Portal',
    url: 'https://owners.kia.com/',
    steps: [
      'Go to owners.kia.com and create an account (or sign in).',
      'Add your vehicle by VIN.',
      'Download the owner\'s manual PDF.',
      'Upload the PDF here.',
    ],
  },
  subaru: {
    name: 'MySubaru',
    url: 'https://www.subaru.com/owners/manuals-guides.html',
    steps: [
      'Go to subaru.com/owners/manuals-guides.html and select your model year.',
      'A MySubaru account lets you save it to your garage, but the manual PDF is downloadable directly.',
      'Upload the PDF here.',
    ],
  },
  mazda: {
    name: 'Mazda Owner Manuals',
    url: 'https://www.mazdausa.com/owners/manuals',
    steps: [
      'Go to mazdausa.com/owners/manuals and select your model year and model.',
      'Download the owner\'s manual PDF.',
      'Upload the PDF here.',
    ],
  },
  volkswagen: {
    name: 'Volkswagen Owner Manuals',
    url: 'https://www.vw.com/en/owners-community/owner-manuals.html',
    steps: [
      'Go to vw.com/en/owners-community/owner-manuals.html and select your model year.',
      'Download the owner\'s manual PDF.',
      'Upload the PDF here.',
    ],
  },
  bmw: {
    name: 'BMW Owner\'s Manuals',
    url: 'https://www.bmwusa.com/owners.html',
    steps: [
      'Go to bmwusa.com/owners.html and sign in to My BMW (or create an account).',
      'Add your vehicle by VIN to see the manual specific to your car\'s options.',
      'Download the PDF and upload it here.',
    ],
  },
  mercedesbenz: {
    name: 'Mercedes Me / Owner Manuals',
    url: 'https://www.mbusa.com/en/owners/manuals',
    steps: [
      'Go to mbusa.com/en/owners/manuals and enter your VIN for the manual specific to your car.',
      'Download the PDF and upload it here.',
    ],
  },
  jeep: {
    name: 'Jeep Owner Manuals',
    url: 'https://www.jeep.com/owner-resources.html',
    steps: [
      'Go to jeep.com/owner-resources.html and select your vehicle by year/model or VIN.',
      'Download the owner\'s manual PDF.',
      'Upload the PDF here.',
    ],
  },
  dodge: {
    name: 'Dodge Owner Manuals',
    url: 'https://www.dodge.com/owner-resources.html',
    steps: [
      'Go to dodge.com/owner-resources.html and select your vehicle by year/model or VIN.',
      'Download the owner\'s manual PDF.',
      'Upload the PDF here.',
    ],
  },
  ram: {
    name: 'RAM Owner Manuals',
    url: 'https://www.ramtrucks.com/owner-resources.html',
    steps: [
      'Go to ramtrucks.com/owner-resources.html and select your vehicle by year/model or VIN.',
      'Download the owner\'s manual PDF.',
      'Upload the PDF here.',
    ],
  },
  chrysler: {
    name: 'Chrysler Owner Manuals',
    url: 'https://www.chrysler.com/owner-resources.html',
    steps: [
      'Go to chrysler.com/owner-resources.html and select your vehicle by year/model or VIN.',
      'Download the owner\'s manual PDF.',
      'Upload the PDF here.',
    ],
  },
  volvo: {
    name: 'Volvo Owner Manuals',
    url: 'https://www.volvocars.com/us/support/manuals/',
    steps: [
      'Go to volvocars.com/us/support/manuals and select your model and year.',
      'Download the owner\'s manual PDF.',
      'Upload the PDF here.',
    ],
  },
}

const FALLBACK = {
  name: 'Manufacturer owner portal',
  url: null,
  steps: [
    'Search "[your make] owners portal" to find the manufacturer\'s official site, and create a free account there.',
    'Add your vehicle using the VIN below — most manufacturer portals will decode it automatically.',
    'Look for "Owner\'s Manual," "Manuals & Guides," or "Warranty & Maintenance" and download the PDF for your exact model year.',
    'Upload the PDF here so it travels with the rest of this vehicle\'s records.',
  ],
}

export function manualSourceFor(make) {
  if (!make) return FALLBACK
  const key = make.toLowerCase().replace(/[^a-z]/g, '')
  return MANUAL_SOURCES[key] || FALLBACK
}
