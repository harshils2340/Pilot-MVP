const { runBizPalSearch } = require('../bizpal.worker');

(async () => {
  const data = await runBizPalSearch({
    location: 'Toronto, ON',
    businessType: 'Restaurant',
    permitTypes: 'Food Permits',
  });

  console.log('TOTAL PERMITS:', data.length);
  console.log(data.slice(0, 3));
})();
