const { runBizPalSearch } = require('../bizpal.worker');

(async () => {
  const data = await runBizPalSearch({
    location: 'Toronto, ON',
    businessType: 'Restaurant',
    permitKeywords: 'Food Permits', // Third input field value from API/website
    // Note: permitTypes also works for backward compatibility
  });

  console.log('TOTAL PERMITS:', data.length);
  console.log(data.slice(0, 3));
})();
