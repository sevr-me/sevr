import { useState, useEffect, useRef } from 'react'
import { geoNaturalEarth1, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import { api } from '@/lib/api'

// Country name lookup for common country codes
const COUNTRY_NAMES = {
  US: 'United States', GB: 'United Kingdom', CA: 'Canada', AU: 'Australia',
  DE: 'Germany', FR: 'France', NL: 'Netherlands', SE: 'Sweden', NO: 'Norway',
  FI: 'Finland', DK: 'Denmark', ES: 'Spain', IT: 'Italy', PT: 'Portugal',
  BR: 'Brazil', MX: 'Mexico', AR: 'Argentina', CL: 'Chile', CO: 'Colombia',
  IN: 'India', CN: 'China', JP: 'Japan', KR: 'South Korea', SG: 'Singapore',
  PH: 'Philippines', ID: 'Indonesia', MY: 'Malaysia', TH: 'Thailand', VN: 'Vietnam',
  RU: 'Russia', UA: 'Ukraine', PL: 'Poland', CZ: 'Czech Republic', RO: 'Romania',
  ZA: 'South Africa', NG: 'Nigeria', EG: 'Egypt', KE: 'Kenya', GH: 'Ghana',
  IL: 'Israel', AE: 'UAE', SA: 'Saudi Arabia', TR: 'Turkey', PK: 'Pakistan',
  NZ: 'New Zealand', IE: 'Ireland', CH: 'Switzerland', AT: 'Austria', BE: 'Belgium',
}

// Map from ISO 3166-1 alpha-2 to numeric codes used in world-atlas TopoJSON
const ALPHA2_TO_NUMERIC = {
  AF: '004', AL: '008', DZ: '012', AS: '016', AD: '020', AO: '024', AG: '028',
  AR: '032', AM: '051', AU: '036', AT: '040', AZ: '031', BS: '044', BH: '048',
  BD: '050', BB: '052', BY: '112', BE: '056', BZ: '084', BJ: '204', BT: '064',
  BO: '068', BA: '070', BW: '072', BR: '076', BN: '096', BG: '100', BF: '854',
  BI: '108', KH: '116', CM: '120', CA: '124', CV: '132', CF: '140', TD: '148',
  CL: '152', CN: '156', CO: '170', KM: '174', CG: '178', CD: '180', CR: '188',
  CI: '384', HR: '191', CU: '192', CY: '196', CZ: '203', DK: '208', DJ: '262',
  DM: '212', DO: '214', EC: '218', EG: '818', SV: '222', GQ: '226', ER: '232',
  EE: '233', ET: '231', FJ: '242', FI: '246', FR: '250', GA: '266', GM: '270',
  GE: '268', DE: '276', GH: '288', GR: '300', GD: '308', GT: '320', GN: '324',
  GW: '624', GY: '328', HT: '332', HN: '340', HU: '348', IS: '352', IN: '356',
  ID: '360', IR: '364', IQ: '368', IE: '372', IL: '376', IT: '380', JM: '388',
  JP: '392', JO: '400', KZ: '398', KE: '404', KI: '296', KP: '408', KR: '410',
  KW: '414', KG: '417', LA: '418', LV: '428', LB: '422', LS: '426', LR: '430',
  LY: '434', LI: '438', LT: '440', LU: '442', MK: '807', MG: '450', MW: '454',
  MY: '458', MV: '462', ML: '466', MT: '470', MH: '584', MR: '478', MU: '480',
  MX: '484', FM: '583', MD: '498', MC: '492', MN: '496', ME: '499', MA: '504',
  MZ: '508', MM: '104', NA: '516', NR: '520', NP: '524', NL: '528', NZ: '554',
  NI: '558', NE: '562', NG: '566', NO: '578', OM: '512', PK: '586', PW: '585',
  PA: '591', PG: '598', PY: '600', PE: '604', PH: '608', PL: '616', PT: '620',
  QA: '634', RO: '642', RU: '643', RW: '646', KN: '659', LC: '662', VC: '670',
  WS: '882', SM: '674', ST: '678', SA: '682', SN: '686', RS: '688', SC: '690',
  SL: '694', SG: '702', SK: '703', SI: '705', SB: '090', SO: '706', ZA: '710',
  SS: '728', ES: '724', LK: '144', SD: '736', SR: '740', SZ: '748', SE: '752',
  CH: '756', SY: '760', TW: '158', TJ: '762', TZ: '834', TH: '764', TL: '626',
  TG: '768', TO: '776', TT: '780', TN: '788', TR: '792', TM: '795', TV: '798',
  UG: '800', UA: '804', AE: '784', GB: '826', US: '840', UY: '858', UZ: '860',
  VU: '548', VE: '862', VN: '704', YE: '887', ZM: '894', ZW: '716',
}

export function WorldMap({ data, onRefresh }) {
  const [backfilling, setBackfilling] = useState(false)
  const [tooltip, setTooltip] = useState(null)
  const [worldData, setWorldData] = useState(null)
  const [loading, setLoading] = useState(true)
  const svgRef = useRef(null)

  // Fetch world TopoJSON data
  useEffect(() => {
    fetch('https://unpkg.com/world-atlas@2/countries-110m.json')
      .then(res => res.json())
      .then(topology => {
        const countries = feature(topology, topology.objects.countries)
        setWorldData(countries)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load world map:', err)
        setLoading(false)
      })
  }, [])

  const handleBackfill = async (country) => {
    setBackfilling(true)
    try {
      const response = await api('/api/admin/backfill-countries', {
        method: 'POST',
        body: JSON.stringify({ country }),
      })
      if (response.ok) {
        onRefresh?.()
      }
    } catch (err) {
      console.error('Backfill failed:', err)
    } finally {
      setBackfilling(false)
    }
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-32 flex flex-col items-center justify-center text-muted-foreground text-sm gap-3">
        <div className="text-center">
          <p>No geographic data available</p>
          <p className="text-xs mt-1">Location is detected on signup via IP geolocation</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleBackfill('US')}
            disabled={backfilling}
            className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
          >
            {backfilling ? 'Setting...' : 'Set all to US'}
          </button>
          <button
            onClick={() => handleBackfill('GB')}
            disabled={backfilling}
            className="px-3 py-1 text-xs bg-secondary text-secondary-foreground rounded hover:bg-secondary/90 disabled:opacity-50"
          >
            Set all to UK
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
        Loading map...
      </div>
    )
  }

  if (!worldData) {
    return (
      <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
        Failed to load map
      </div>
    )
  }

  // Create a map of country numeric code -> count
  const countryData = {}
  let maxCount = 0
  for (const item of data) {
    const numericCode = ALPHA2_TO_NUMERIC[item.country]
    if (numericCode) {
      countryData[numericCode] = { count: item.count, alpha2: item.country }
      if (item.count > maxCount) maxCount = item.count
    }
  }

  // Set up projection and path generator
  const width = 800
  const height = 400
  const projection = geoNaturalEarth1()
    .scale(150)
    .translate([width / 2, height / 2])
  const pathGenerator = geoPath().projection(projection)

  return (
    <div className="space-y-3">
      {/* Map */}
      <div className="relative w-full">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto"
          style={{ maxHeight: '300px' }}
        >
          {/* Ocean background */}
          <rect x="0" y="0" width={width} height={height} className="fill-muted/30" />

          {/* Countries */}
          {worldData.features.map((feature) => {
            const countryId = feature.id
            const countryInfo = countryData[countryId]
            const count = countryInfo?.count || 0
            const alpha2 = countryInfo?.alpha2
            const intensity = count / (maxCount || 1)
            const hasData = count > 0
            const countryName = alpha2 ? (COUNTRY_NAMES[alpha2] || alpha2) : feature.properties?.name

            return (
              <path
                key={countryId}
                d={pathGenerator(feature)}
                fill="currentColor"
                fillOpacity={hasData ? 0.4 + intensity * 0.5 : 0.15}
                stroke="currentColor"
                strokeOpacity={0.4}
                strokeWidth={0.5}
                className={hasData ? "text-primary cursor-pointer transition-opacity hover:opacity-80" : "text-muted-foreground"}
                onMouseEnter={(e) => {
                  if (hasData) {
                    const rect = e.currentTarget.getBoundingClientRect()
                    setTooltip({ name: countryName, count, x: rect.left + rect.width / 2, y: rect.top })
                  }
                }}
                onMouseLeave={() => setTooltip(null)}
              />
            )
          })}
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="fixed z-50 px-2 py-1 text-xs bg-popover text-popover-foreground border rounded shadow-lg pointer-events-none whitespace-nowrap"
            style={{
              left: tooltip.x,
              top: tooltip.y - 32,
              transform: 'translateX(-50%)'
            }}
          >
            {tooltip.name}: {tooltip.count} {tooltip.count === 1 ? 'user' : 'users'}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm justify-center">
        {data.slice(0, 6).map((item) => {
          const name = COUNTRY_NAMES[item.country] || item.country
          return (
            <div key={item.country} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-sm bg-primary"
                style={{ opacity: 0.4 + (item.count / maxCount) * 0.5 }}
              />
              <span className="text-muted-foreground">{name}</span>
              <span className="font-medium">{item.count}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
