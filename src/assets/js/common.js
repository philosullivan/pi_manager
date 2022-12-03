'use strict';
const { ipcRenderer } = require( 'electron' );
const shelljs         = require( 'shelljs' );
const path            = require( 'path' );
const fs              = require( 'fs-extra' );
const os              = require( 'os' );
const ls              = require( 'local-storage' );


// Get app info from main process.
const app_info = ipcRenderer.sendSync('app_info');
const app_path      = app_info.app_path;
const app_name      = app_info.app_name;
const app_data      = app_info.app_data;

const config_object = JSON.parse( fs.readFileSync( `${app_data}/data.json`, 'utf8' ) );
const requirements  = config_object.requirements;

// Variables //
var intViewportWidth  = window.innerWidth;
var intViewportHeight = window.innerHeight;

// On load.
document.addEventListener( 'DOMContentLoaded', ( event ) => {
  $(document).foundation();

  // Debug.
  intViewportWidth  = window.innerWidth;
  intViewportHeight = window.innerHeight;
  $('#size').html(`Width: ${intViewportWidth} || Height: ${intViewportHeight}`);

  // .
  add_event_handlers();
});

// Generic return from back end functions.
// TODO make this extensable.
ipcRenderer.on( 'error', function ( event, data ) {
  display_error( data );
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
  display_error(`${exception_error}`);
  return true;
};

// .
const display_error = ( msg ) => {
  $( '#dlg_error_msg' ).html( `${msg}` );
  $( '#dlg_error' ).foundation( 'open') ;
}

// Shows the loading spinner.
const loader_show = (element = 'content') => {
$.LoadingOverlay('show', {
  image: "",
  background: 'rgba(255, 255, 255, 0.92)',
  fontawesome: 'fad fa-spinner fa-spin',
  fontawesomeColor: '#BB2525',
  zIndex: 1000
});
}

// Hide the loading spinner.
const loader_hide = (element = 'content') => {
  $.LoadingOverlay('hide', true);
}

// Run shell commands in the main thread.
const run_shell = ( cmd ) => {
  return ipcRenderer.sendSync( 'run_cmd', [ cmd ] );
}

// .
const add_event_handlers = () => {
  // .
  
  $( document ).on( 'click', '#btn_main_menu', function () {
    $( '#main_menu' ).foundation( 'open' );
  });

  $( document ).on( 'click', '.mnu', function () {
    $( '#main_menu' ).foundation( 'close' );
  });
  

}

// .
const exit_app = () => {
  let result  = window.confirm( 'Are you sure you want to exit?' );
  let message = result ? 'YES' : 'NO';
  if ( message === 'YES' ) {
    ipcRenderer.sendSync( 'exit' );
  }
}

//.
const check_requirements = () => {

  for (const [ key, value ] of Object.entries( requirements ) ) {
    // console.log( `KEY: ${key} || VALUE: ${value.name}` );

    let app_name        = `${value.name}`;
    let app_get_version = `${value.version}`;
    

    // console.log( `app_name: ${app_name}` );
    // console.log( `app_get_version: ${app_get_version}` );

    // .
    let exists = run_shell( `which ${value.name}` );

    // 0 = exists.
    let app_code = exists.code;
    if ( app_code === 0 ) {
      console.log( `${app_name} Exists` );
    }
  }
}

//.
const get_hardware_info = () => {
  let cpu_info = ipcRenderer.sendSync( 'cpu_info' );
  console.log( JSON.stringify( cpu_info ) );
}