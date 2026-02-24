export interface LocationSuggestion {
  city: string;
  state: string;
  country: string;
  display: string; // e.g., "Ottawa, Ontario" or "San Francisco, CA"
}

export const LOCATION_SUGGESTIONS: LocationSuggestion[] = [
  // Canadian Cities
  { city: 'Ottawa', state: 'Ontario', country: 'CA', display: 'Ottawa, Ontario' },
  { city: 'Toronto', state: 'Ontario', country: 'CA', display: 'Toronto, Ontario' },
  { city: 'Vancouver', state: 'British Columbia', country: 'CA', display: 'Vancouver, British Columbia' },
  { city: 'Montreal', state: 'Quebec', country: 'CA', display: 'Montreal, Quebec' },
  { city: 'Calgary', state: 'Alberta', country: 'CA', display: 'Calgary, Alberta' },
  { city: 'Edmonton', state: 'Alberta', country: 'CA', display: 'Edmonton, Alberta' },
  { city: 'Winnipeg', state: 'Manitoba', country: 'CA', display: 'Winnipeg, Manitoba' },
  { city: 'Quebec City', state: 'Quebec', country: 'CA', display: 'Quebec City, Quebec' },
  { city: 'Hamilton', state: 'Ontario', country: 'CA', display: 'Hamilton, Ontario' },
  { city: 'Kitchener', state: 'Ontario', country: 'CA', display: 'Kitchener, Ontario' },
  { city: 'London', state: 'Ontario', country: 'CA', display: 'London, Ontario' },
  { city: 'Halifax', state: 'Nova Scotia', country: 'CA', display: 'Halifax, Nova Scotia' },
  { city: 'Victoria', state: 'British Columbia', country: 'CA', display: 'Victoria, British Columbia' },
  { city: 'Windsor', state: 'Ontario', country: 'CA', display: 'Windsor, Ontario' },
  { city: 'Saskatoon', state: 'Saskatchewan', country: 'CA', display: 'Saskatoon, Saskatchewan' },
  { city: 'Regina', state: 'Saskatchewan', country: 'CA', display: 'Regina, Saskatchewan' },
  { city: 'Mississauga', state: 'Ontario', country: 'CA', display: 'Mississauga, Ontario' },
  { city: 'Brampton', state: 'Ontario', country: 'CA', display: 'Brampton, Ontario' },
  { city: 'Markham', state: 'Ontario', country: 'CA', display: 'Markham, Ontario' },
  { city: 'Richmond Hill', state: 'Ontario', country: 'CA', display: 'Richmond Hill, Ontario' },
  
  // US Cities
  { city: 'San Francisco', state: 'CA', country: 'US', display: 'San Francisco, CA' },
  { city: 'Los Angeles', state: 'CA', country: 'US', display: 'Los Angeles, CA' },
  { city: 'New York', state: 'NY', country: 'US', display: 'New York, NY' },
  { city: 'Chicago', state: 'IL', country: 'US', display: 'Chicago, IL' },
  { city: 'Houston', state: 'TX', country: 'US', display: 'Houston, TX' },
  { city: 'Phoenix', state: 'AZ', country: 'US', display: 'Phoenix, AZ' },
  { city: 'Philadelphia', state: 'PA', country: 'US', display: 'Philadelphia, PA' },
  { city: 'San Antonio', state: 'TX', country: 'US', display: 'San Antonio, TX' },
  { city: 'San Diego', state: 'CA', country: 'US', display: 'San Diego, CA' },
  { city: 'Dallas', state: 'TX', country: 'US', display: 'Dallas, TX' },
  { city: 'San Jose', state: 'CA', country: 'US', display: 'San Jose, CA' },
  { city: 'Austin', state: 'TX', country: 'US', display: 'Austin, TX' },
  { city: 'Jacksonville', state: 'FL', country: 'US', display: 'Jacksonville, FL' },
  { city: 'Fort Worth', state: 'TX', country: 'US', display: 'Fort Worth, TX' },
  { city: 'Columbus', state: 'OH', country: 'US', display: 'Columbus, OH' },
  { city: 'Charlotte', state: 'NC', country: 'US', display: 'Charlotte, NC' },
  { city: 'Seattle', state: 'WA', country: 'US', display: 'Seattle, WA' },
  { city: 'Denver', state: 'CO', country: 'US', display: 'Denver, CO' },
  { city: 'Boston', state: 'MA', country: 'US', display: 'Boston, MA' },
  { city: 'El Paso', state: 'TX', country: 'US', display: 'El Paso, TX' },
  { city: 'Detroit', state: 'MI', country: 'US', display: 'Detroit, MI' },
  { city: 'Nashville', state: 'TN', country: 'US', display: 'Nashville, TN' },
  { city: 'Portland', state: 'OR', country: 'US', display: 'Portland, OR' },
  { city: 'Oklahoma City', state: 'OK', country: 'US', display: 'Oklahoma City, OK' },
  { city: 'Las Vegas', state: 'NV', country: 'US', display: 'Las Vegas, NV' },
  { city: 'Memphis', state: 'TN', country: 'US', display: 'Memphis, TN' },
  { city: 'Louisville', state: 'KY', country: 'US', display: 'Louisville, KY' },
  { city: 'Baltimore', state: 'MD', country: 'US', display: 'Baltimore, MD' },
  { city: 'Milwaukee', state: 'WI', country: 'US', display: 'Milwaukee, WI' },
  { city: 'Albuquerque', state: 'NM', country: 'US', display: 'Albuquerque, NM' },
  { city: 'Tucson', state: 'AZ', country: 'US', display: 'Tucson, AZ' },
  { city: 'Fresno', state: 'CA', country: 'US', display: 'Fresno, CA' },
  { city: 'Sacramento', state: 'CA', country: 'US', display: 'Sacramento, CA' },
  { city: 'Kansas City', state: 'MO', country: 'US', display: 'Kansas City, MO' },
  { city: 'Mesa', state: 'AZ', country: 'US', display: 'Mesa, AZ' },
  { city: 'Atlanta', state: 'GA', country: 'US', display: 'Atlanta, GA' },
  { city: 'Omaha', state: 'NE', country: 'US', display: 'Omaha, NE' },
  { city: 'Raleigh', state: 'NC', country: 'US', display: 'Raleigh, NC' },
  { city: 'Miami', state: 'FL', country: 'US', display: 'Miami, FL' },
  { city: 'Oakland', state: 'CA', country: 'US', display: 'Oakland, CA' },
  { city: 'Minneapolis', state: 'MN', country: 'US', display: 'Minneapolis, MN' },
  { city: 'Tulsa', state: 'OK', country: 'US', display: 'Tulsa, OK' },
  { city: 'Cleveland', state: 'OH', country: 'US', display: 'Cleveland, OH' },
  { city: 'Wichita', state: 'KS', country: 'US', display: 'Wichita, KS' },
  { city: 'Arlington', state: 'TX', country: 'US', display: 'Arlington, TX' },
];

// Helper function to filter locations based on search query
export function filterLocations(query: string): LocationSuggestion[] {
  if (!query.trim()) {
    return LOCATION_SUGGESTIONS.slice(0, 12); // Return first 12 when empty
  }
  
  const queryLower = query.toLowerCase().replace(/,/g, ' ');
  const terms = queryLower.split(/\s+/).filter(Boolean);
  return LOCATION_SUGGESTIONS.filter(location => {
    const displayLower = location.display.toLowerCase();
    const cityLower = location.city.toLowerCase();
    const stateLower = location.state.toLowerCase();
    return terms.every(
      term =>
        displayLower.includes(term) ||
        cityLower.includes(term) ||
        stateLower.includes(term)
    );
  }).slice(0, 12); // Limit to 12 results
}



