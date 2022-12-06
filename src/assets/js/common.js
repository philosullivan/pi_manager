'use strict';
const { ipcRenderer } = require( 'electron' );
const shelljs         = require( 'shelljs' );
const path            = require( 'path' );
const fs              = require( 'fs-extra' );
const os              = require( 'os' );
const ls              = require( 'local-storage' );
const trim            = require( '@stdlib/string-trim' );
const si              = require('systeminformation');

// Get app info from main process.
const app_info      = ipcRenderer.sendSync('app_info');
const app_path      = app_info.app_path;
const app_name      = app_info.app_name;
const app_data      = app_info.app_data;
const partials_dir  = app_info.partials_dir;

const config_object = JSON.parse( fs.readFileSync( `${app_data}/data.json`, 'utf8' ) );
const requirements  = config_object.requirements;

// Variables //
var intViewportWidth  = window.innerWidth;
var intViewportHeight = window.innerHeight;

$('#size').html(`Width: ${intViewportWidth} || Height: ${intViewportHeight}`);


var current_template;


// On load.
document.addEventListener( 'DOMContentLoaded', ( event ) => {
  $(document).foundation();

  // Debug.
  intViewportWidth  = window.innerWidth;
  intViewportHeight = window.innerHeight;
  $('#size').html(`Width: ${intViewportWidth} || Height: ${intViewportHeight}`);

  // .
  if ( tabs_exist ) {
    set_tab_height();
  }

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
$( window ).on('resize', function (e) {
  intViewportWidth  = window.innerWidth;
  intViewportHeight = window.innerHeight;

  $('#size').html(`Width: ${intViewportWidth} || Height: ${intViewportHeight}`);

  if ( tabs_exist() ) {
    set_tab_height();
  }

});

// Try and report all unhandled exceptions.
window.onerror = function (msg, url, line) {
  let exception_error = ` MSG: ${msg} URL: ${url} Line: ${line}`;
  display_error(`${exception_error}`);
  return true;
};

// .
const tabs_exist = () => {
  const tabs = document.getElementsByClassName( 'tabs-panel' );
  return tabs.length;
}

// .
const set_tab_height = () => {
  $('.tabs-panel').height( intViewportHeight - 280 );
}

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
  
  // .
  $( document ).on( 'click', '.load_template', function () {
    let template = $(this).data( 'template' );
    load_template( template );
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
  // let cpu_info = ipcRenderer.sendSync( 'cpu_info' );
  // console.log( JSON.stringify( cpu_info ) );

  let cpu_info   = '/proc/cpuinfo';
  let cpu_data   = fs.readFileSync( cpu_info, {encoding:'utf8', flag:'r'});

  try {
    // console.log( cpu_data );
    cpu_data.split(/\r?\n/).forEach( line =>  {
     let proc_numb;

     if ( trim( line ) ) { 
       //console.log( 'has line' );

       let entry = line.split(':');
       let key   = trim( entry[0] );
       let value = trim( entry[1] );

       // console.log( `key: ${key} | Value: ${value}` );
       $( 'table tbody' ).append( `<tr><td>${key}</td><td>${value}</td></tr>` );
     }

    });
  } catch( err)  {
    alert(err);
  }
}

// .
const load_template = async ( template_name ) => {
  let template    = `${partials_dir}/${template_name}.html`;

  // .
  if (  current_template === `${template_name}.html` ) {
    return;
  }

  // .
  loader_show();

  // .
  setTimeout(() => {
    $( "#content" ).load( `${template}`, function( response, status, xhr ) {
      if ( status == "error" ) {
        var msg = "Sorry but there was an error: ";
        alert( status );
      }
      current_template = `${template_name}.html`;
      ls.set( 'current_template', template_name );
      $( document ).foundation();

        // .
        if ( tabs_exist ) {
          set_tab_height();
        }

      loader_hide();
    });
  }, '750' );

};

// .
const get_pinout = () => {
  let pinout      = run_shell( `pinout` );
  let pinout_data = pinout.stdout;
  // console.log( pinout.stdout );
  // $('#content').html( pinout.stdout );
  pinout_data.split(/\r?\n/).forEach( line =>  {
    console.log( trim(line) );
    $( "#content" ).append( `<div class="columns small-12">${line}</div>` );
    /*
    if ( trim( line ) ) { 
      let entry = line.split(':');
      let key   = trim( entry[0] );
      let value = trim( entry[1] );
      console.log( `key: ${key} | Value: ${value}` );
    }
    */
  });
}

// .
const get_system_info = () => {
  let cpu_info   = '/proc/cpuinfo';
  let cpu_data   = fs.readFileSync( cpu_info, {encoding:'utf8', flag:'r'});

  try {
    cpu_data.split(/\r?\n/).forEach( line =>  {
     if ( trim( line ) ) { 
       let entry = line.split(':');
       let key   = trim( entry[0] );
       let value = trim( entry[1] );
       $( '#tbl-cpuinfo tbody' ).append( `<tr><td>${key}</td><td>${value}</td></tr>` );
     }
    });
  } catch( e )  {
    console.log( e );
  }

  // CPU Info.
  try {
    si.cpu( function( data ) {
      for (const [ key, value ] of Object.entries( data ) ) {
        if ( typeof value !== 'object' && value !== null && !Array.isArray( value ) ) {
          $( "#tbl-si-cpu" ).append( `<tr><td>${key}</td><td>${value}</td></tr>` );
        } else {
          for (const [ subkey, subvalue ] of Object.entries( value ) ) {
            $( "#tbl-si-cpu" ).append( `<tr><td>${subkey}</td><td>${subvalue}</td></tr>` );
          }
        }
      }
    });
  } catch ( e ) {
    console.log( e );
  }

  // System Info.
  try {
    si.system( function( data ) {
      for (const [ key, value ] of Object.entries( data ) ) {
        if ( typeof value !== 'object' && value !== null && !Array.isArray( value ) ) {
          $( "#tbl-si-version" ).append( `<tr><td>${key}</td><td>${value}</td></tr>` );
        } else {
          for (const [ subkey, subvalue ] of Object.entries( value ) ) {
            $( "#tbl-si-version" ).append( `<tr><td>${subkey}</td><td>${subvalue}</td></tr>` );
          }
        }
      }
    });
  } catch ( e ) {
    console.log( e );
  }

  // .
  try {
    si.chassis( function( data ) {
      for (const [ key, value ] of Object.entries( data ) ) {
        if ( typeof value !== 'object' && value !== null && !Array.isArray( value ) ) {
          $( "#tbl-si-time" ).append( `<tr><td>${key}</td><td>${value}</td></tr>` );
        } else {
          for (const [ subkey, subvalue ] of Object.entries( value ) ) {
            $( "#tbl-si-time" ).append( `<tr><td>${subkey}</td><td>${subvalue}</td></tr>` );
          }
        }
      }
    });
  } catch ( e ) {
    console.log( e );
  }

}