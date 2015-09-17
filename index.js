#! /usr/bin/env node

"use strict"; 

require("babel/register");

var request = require("request-promise");
var blc = require("./lib/broken-link-checker-mod");
var chalk = require("chalk");

var broken = [];
var crawled = {};
var toCrawl = [];

//Crawl if haven't crawled & url isn't queued & page is internal
var shouldCrawl = function (result) {
  var url = result.url.resolved,
    shouldQueue;
  if(crawled[url]) return false;
  if(result.broken || result.html.tagName === "img" && result.html.attrName === "src"){
    shouldQueue = false;
  }else if(result.internal){
    shouldQueue = true;
  }
  crawled[url] = true;
  return shouldQueue;
}

function findBroken (page, basePage) {
  crawled[page] = true;
  var checker = new blc.HtmlChecker({crawledPages: Object.keys(crawled)}, {
    link: function (result) {
      var url = result.url.resolved;
      if(result.error) {
        broken.push({page: page, link: url, error: result.error.message});
      }

      if(shouldCrawl(result)){
        toCrawl.push(url);
      }
    },
    complete: function () {
      var nextPage = toCrawl.pop();
      if(nextPage){
        return findBroken(nextPage, basePage);
      }else{
        if(broken.length === 0){
          console.log(chalk.green("No breaks!"));
        }else{
          console.log(chalk.blue.underline.bold("You might want to fix: "));
          console.log(chalk.gray.dim("-----"));
          broken.forEach((breakage) => {
            console.log(chalk.white("Page: ", breakage.page));
            console.log(chalk.red("Link: ", breakage.link));
            console.log(chalk.magenta("Error: ", breakage.error));
            console.log(chalk.gray.dim("-----"));
          });
        }
      }
    }
  });
  var requestOptions = {
    followRedirect: true,
    followAllRedirects: true,
    maxRedirects: 15,
    uri: page
  };
  request(requestOptions).then((html) => {
    checker.scan(html, basePage);
  }).catch((err) => {
    console.log("ERROR: ", err);
  });
};

function searchSite (basePage) {
  findBroken(basePage, basePage)
}

var site = process.argv.slice(2)[0];

searchSite(site);

