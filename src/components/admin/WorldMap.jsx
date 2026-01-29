// Simplified world map paths for major countries
// Using a simplified Natural Earth projection
const COUNTRY_PATHS = {
  US: "M 48 45 L 105 45 L 105 75 L 48 75 Z",
  CA: "M 48 15 L 120 15 L 120 45 L 48 45 Z",
  MX: "M 48 75 L 85 75 L 85 95 L 48 95 Z",
  BR: "M 110 95 L 150 95 L 150 145 L 110 145 Z",
  AR: "M 105 145 L 130 145 L 130 190 L 105 190 Z",
  GB: "M 190 35 L 200 35 L 200 50 L 190 50 Z",
  FR: "M 185 50 L 205 50 L 205 70 L 185 70 Z",
  DE: "M 200 40 L 220 40 L 220 60 L 200 60 Z",
  IT: "M 205 60 L 220 60 L 220 80 L 205 80 Z",
  ES: "M 175 55 L 195 55 L 195 75 L 175 75 Z",
  PL: "M 215 40 L 235 40 L 235 55 L 215 55 Z",
  UA: "M 230 40 L 260 40 L 260 55 L 230 55 Z",
  RU: "M 240 10 L 380 10 L 380 60 L 240 60 Z",
  CN: "M 310 50 L 370 50 L 370 95 L 310 95 Z",
  JP: "M 375 55 L 395 55 L 395 80 L 375 80 Z",
  KR: "M 365 60 L 378 60 L 378 75 L 365 75 Z",
  IN: "M 285 70 L 325 70 L 325 115 L 285 115 Z",
  AU: "M 340 130 L 395 130 L 395 175 L 340 175 Z",
  ZA: "M 220 140 L 250 140 L 250 170 L 220 170 Z",
  NG: "M 200 95 L 220 95 L 220 115 L 200 115 Z",
  EG: "M 225 70 L 245 70 L 245 90 L 225 90 Z",
  SA: "M 245 75 L 275 75 L 275 100 L 245 100 Z",
  TR: "M 225 55 L 255 55 L 255 70 L 225 70 Z",
  ID: "M 330 105 L 380 105 L 380 125 L 330 125 Z",
  PH: "M 365 85 L 380 85 L 380 105 L 365 105 Z",
  VN: "M 340 80 L 355 80 L 355 105 L 340 105 Z",
  TH: "M 325 85 L 340 85 L 340 110 L 325 110 Z",
  NL: "M 195 40 L 205 40 L 205 48 L 195 48 Z",
  BE: "M 192 48 L 202 48 L 202 55 L 192 55 Z",
  SE: "M 210 15 L 225 15 L 225 40 L 210 40 Z",
  NO: "M 200 10 L 215 10 L 215 35 L 200 35 Z",
  FI: "M 225 15 L 240 15 L 240 35 L 225 35 Z",
  DK: "M 205 35 L 215 35 L 215 42 L 205 42 Z",
  CH: "M 198 55 L 210 55 L 210 62 L 198 62 Z",
  AT: "M 210 55 L 225 55 L 225 62 L 210 62 Z",
  PT: "M 170 60 L 178 60 L 178 75 L 170 75 Z",
  IE: "M 178 38 L 188 38 L 188 48 L 178 48 Z",
  NZ: "M 395 165 L 410 165 L 410 185 L 395 185 Z",
  CL: "M 95 145 L 105 145 L 105 195 L 95 195 Z",
  CO: "M 85 90 L 105 90 L 105 110 L 85 110 Z",
  PE: "M 80 105 L 100 105 L 100 130 L 80 130 Z",
  VE: "M 95 85 L 115 85 L 115 100 L 95 100 Z",
  IL: "M 235 68 L 242 68 L 242 80 L 235 80 Z",
  AE: "M 260 80 L 275 80 L 275 90 L 260 90 Z",
  SG: "M 338 108 L 345 108 L 345 115 L 338 115 Z",
  MY: "M 330 100 L 355 100 L 355 110 L 330 110 Z",
  PK: "M 275 60 L 295 60 L 295 80 L 275 80 Z",
  BD: "M 300 75 L 315 75 L 315 90 L 300 90 Z",
  CZ: "M 210 48 L 225 48 L 225 55 L 210 55 Z",
  RO: "M 225 55 L 245 55 L 245 65 L 225 65 Z",
  HU: "M 215 55 L 230 55 L 230 62 L 215 62 Z",
  GR: "M 220 65 L 235 65 L 235 78 L 220 78 Z",
}

// Country name lookup
const COUNTRY_NAMES = {
  US: "United States", CA: "Canada", MX: "Mexico", BR: "Brazil", AR: "Argentina",
  GB: "United Kingdom", FR: "France", DE: "Germany", IT: "Italy", ES: "Spain",
  PL: "Poland", UA: "Ukraine", RU: "Russia", CN: "China", JP: "Japan",
  KR: "South Korea", IN: "India", AU: "Australia", ZA: "South Africa", NG: "Nigeria",
  EG: "Egypt", SA: "Saudi Arabia", TR: "Turkey", ID: "Indonesia", PH: "Philippines",
  VN: "Vietnam", TH: "Thailand", NL: "Netherlands", BE: "Belgium", SE: "Sweden",
  NO: "Norway", FI: "Finland", DK: "Denmark", CH: "Switzerland", AT: "Austria",
  PT: "Portugal", IE: "Ireland", NZ: "New Zealand", CL: "Chile", CO: "Colombia",
  PE: "Peru", VE: "Venezuela", IL: "Israel", AE: "UAE", SG: "Singapore",
  MY: "Malaysia", PK: "Pakistan", BD: "Bangladesh", CZ: "Czech Republic", RO: "Romania",
  HU: "Hungary", GR: "Greece",
}

export function WorldMap({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-32 flex flex-col items-center justify-center text-muted-foreground text-sm">
        <p>No geographic data available</p>
        <p className="text-xs mt-1">Location is detected on signup via IP geolocation</p>
      </div>
    )
  }

  // Create a map of country -> count
  const countryData = {}
  let maxCount = 0
  for (const item of data) {
    countryData[item.country] = item.count
    if (item.count > maxCount) maxCount = item.count
  }

  // Calculate color intensity (0-1) for each country
  const getIntensity = (country) => {
    const count = countryData[country] || 0
    return count / (maxCount || 1)
  }

  return (
    <div className="space-y-4">
      {/* Map */}
      <div className="w-full overflow-x-auto">
        <svg viewBox="0 0 420 200" className="w-full h-40">
          {/* Background */}
          <rect x="0" y="0" width="420" height="200" fill="currentColor" fillOpacity={0.03} className="text-foreground" />

          {/* Ocean hint */}
          <rect x="0" y="0" width="420" height="200" fill="currentColor" fillOpacity={0.02} className="text-primary" />

          {/* Countries */}
          {Object.entries(COUNTRY_PATHS).map(([code, path]) => {
            const intensity = getIntensity(code)
            const hasData = countryData[code] > 0
            return (
              <g key={code}>
                <path
                  d={path}
                  fill="currentColor"
                  fillOpacity={hasData ? 0.2 + intensity * 0.6 : 0.05}
                  stroke="currentColor"
                  strokeOpacity={0.2}
                  strokeWidth={0.5}
                  className={hasData ? "text-primary" : "text-muted-foreground"}
                />
                {hasData && (
                  <title>{COUNTRY_NAMES[code] || code}: {countryData[code]} users</title>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      {/* Legend / Top countries list */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
        {data.slice(0, 6).map((item) => (
          <div key={item.country} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-sm bg-primary"
              style={{ opacity: 0.2 + (item.count / maxCount) * 0.6 }}
            />
            <span className="text-muted-foreground">{COUNTRY_NAMES[item.country] || item.country}</span>
            <span className="font-medium">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
