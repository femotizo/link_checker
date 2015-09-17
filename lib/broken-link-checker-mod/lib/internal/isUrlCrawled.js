require("babel/register");

"use strict";

function matchUrl(url, crawledUrls)
{
  return crawledUrls.includes(url);
}



module.exports = matchUrl;
