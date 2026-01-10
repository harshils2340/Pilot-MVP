const { runBizPalSearch } = require('../bizpal.worker');

(async () => {
  const data = await runBizPalSearch({
    location: 'Ottawa',
    businessType: 'Restaurant',
    permitTypes: 'Zoning Plumbing',
  });

  console.log('TOTAL PERMITS:', data.length);
  console.log(data.slice(0, 3));
})();
