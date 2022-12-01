'use strict';
const { ipcRenderer } = require( 'electron' );
const shelljs         = require( 'shelljs' );
const path            = require( 'path' );
const fs              = require( 'fs-extra' );
const os              = require( 'os' );
const ls              = require( 'local-storage' );


const user_home_dir   = os.homedir();

// Variables //
var settings          = null;
var intViewportWidth  = window.innerWidth;
var intViewportHeight = window.innerHeight;


// On load.
document.addEventListener( 'DOMContentLoaded', ( event ) => {
  $(document).foundation();

  // Debug.
  intViewportWidth  = window.innerWidth;
  intViewportHeight = window.innerHeight;
  $('#size').html(`Width: ${intViewportWidth} || Height: ${intViewportHeight}`);


});


// Generic return from back end functions.
// TODO make this extensable.
ipcRenderer.on( 'error', function (event, data) {
  console.error( data );
  alert( data );
});


// Open Chrome Dev Tools.
$(document).on( 'click', '#btn_mnu_devtools', function () {
  ipcRenderer.sendSync('open_dev_tools');
});

// Exit application.
$(document).on( 'click', '#btn_mnu_exit', function () {
  ipcRenderer.sendSync('exit');
});


// Resize events, mostly for debug.
$(window).on('resize', function (e) {
  intViewportWidth  = window.innerWidth;
  intViewportHeight = window.innerHeight;
  $('#size').html(`Width: ${intViewportWidth} || Height: ${intViewportHeight}`);
});

// Try and report all unhandled exceptions.
window.onerror = function (msg, url, line) {
  let exception_error = ` MSG: ${msg} URL: ${url} Line: ${line}`;
  custom_error(`${exception_error}`);
  return true;
};

// .
const custom_error = (msg) => {
  // $('#err_msg').html(`${msg}`);
  // $('#dlg-error').foundation('open');
  alert( msg );
}

// .
const loader_show = (element = 'content') => {
$.LoadingOverlay('show', {
  image: "",
  background: 'rgba(255, 255, 255, 0.92)',
  fontawesome: 'fad fa-spinner fa-spin',
  fontawesomeColor: '#BB2525',
  zIndex: 1000
});
}

// .
const loader_hide = (element = 'content') => {
$.LoadingOverlay('hide', true);
}

/**
 * Add entries into the log file.
 *
 * @param {string} msg Messege content to add to the log file.
 * @param {string} type The level to log at ( info, warn, error, etc ).
 * @returns nothing
const log = (msg, type = 'info') => {
  ipcRenderer.send('log', [msg, type]);
}
*/

// Run shell commands in the main thread.
const run_shell = ( cmd ) => {
  return ipcRenderer.sendSync( 'run_cmd', [ cmd ] );
}
