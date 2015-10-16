'use strict';

// Load system modules
let url = require( 'url' );

// Load modules
let cheerio = require( 'cheerio' );
let Promise = require( 'bluebird' );
let request = require( 'request' );
let debug = require( 'debug' )( 'twitter-scraper:page-handler' );

// Load my modules


// Constant declaration
const TW_BASE_URL = 'twitter.com';
const TW_QUERY_PATH = 'search';
const SESSION_CONTAINER = '.stream-container[data-max-position]';
const TWEETS_SELECTOR = '.stream-item[data-item-id]';


// Module variables declaration

// Module functions declaration

// Module class declaration
class PageHandler {
  constructor() {
    debug( 'Creating page handler' );
  }

  getTwitterUrl( query, maxPosition ) {
    let qs = {
      /* eslint-disable camelcase */
      f: 'tweets',
      vertical: 'news',
      include_entities: 0,
      max_position: maxPosition,
      q: query,
      /* eslint-enable camelcase */
    };

    let fullPath = TW_QUERY_PATH;
    if( maxPosition ) {
      fullPath = 'i/search/timeline';
    }

    let fullUrl = url.format( {
      protocol: 'https',
      host: TW_BASE_URL,
      pathname: fullPath,
      query: qs,
    } );

    return fullUrl;
  }

  getPage( fullUrl ) {
    // debug( 'Get page: %s', fullUrl );

    return request
    .getAsync( {
      method: 'GET',
      url: fullUrl,
      json: true,
    } )
    .spread( ( res, body )=> {
      if( typeof body==='string' ) {
        return body;
      } else {
        return body.items_html;
      }
    } )
    ;
  }

  getSession( query ) {
    let pageUrl = this.getTwitterUrl( query );

    return this
    .getPage( pageUrl )
    .then( page => {
      let $ = cheerio.load( page );
      let $container = $( SESSION_CONTAINER );
      let maxPosition = $container.data( 'max-position' );

      if( maxPosition ) {
        return maxPosition.split( '-' )[3];
      }

      throw new Error( '"data-max-position" not found in "'+SESSION_CONTAINER+'"' );
    } )
    ;
  }
  getTweetIds( html ) {
    // Parse the html with cheerio
    let $ = cheerio.load( html );

    // Get the list of IDS
    let ids = $( TWEETS_SELECTOR )
    // Get the "data-item-id" attribute (so it is a string)
    .map( ( i, div ) => $( div ).attr( 'data-item-id' ) )
    // Get the array of ids
    .get();

    return ids;
  }

  getMaxPosition( session, first, last ) {
    let maxPosition = null;
    if( first && last ) {
      maxPosition = `TWEET-${last}-${first}-${session}`;
    }

    return maxPosition;
  }
}

// Module initialization (at first load)
request = Promise.promisifyAll( request );

// Module exports

module.exports = PageHandler;