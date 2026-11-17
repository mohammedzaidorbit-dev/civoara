import { reverseGeocodeNearest } from '../src/lib/maps/geocoding';

async function main() {
  console.log('Testing reverseGeocodeNearest on Bengaluru central coordinates...');
  const res = await reverseGeocodeNearest(12.9716, 77.5946);
  console.log('Address:', res.formattedAddress);
  console.log('Ward:', res.wardName);
  console.log('Source:', res.source);
  console.log('Google Maps URL:', res.googleMapsUrl);
  console.log('Street View URL:', res.streetViewUrl);

  if (!res.googleMapsUrl.includes('google.com/maps')) {
    throw new Error('Expected Google Maps URL');
  }
  if (!res.streetViewUrl.includes('google.com/maps/@')) {
    throw new Error('Expected Google Street View URL');
  }
  if (!res.wardName) {
    throw new Error('Expected municipal ward name');
  }

  console.log('\nTesting reverseGeocodeNearest on Municipal Ward 1 coordinates...');
  const ward1Res = await reverseGeocodeNearest(40.7128, -74.006);
  console.log('Address:', ward1Res.formattedAddress);
  console.log('Ward:', ward1Res.wardName);
  console.log('Google Maps URL:', ward1Res.googleMapsUrl);
  if (!ward1Res.wardName.includes('Ward 1')) {
    throw new Error('Expected Ward 1 resolution');
  }

  console.log('✓ Both geocoding tests passed successfully!');
}

main().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
