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
var current_template;
var intViewportWidth  = window.innerWidth;
var intViewportHeight = window.innerHeight;
$('#size').html(`Width: ${intViewportWidth} || Height: ${intViewportHeight}`);

// On load.
document.addEventListener( 'DOMContentLoaded', ( event ) => {
  $(document).foundation();

  // Debug.
  intViewportWidth  = window.innerWidth;
  intViewportHeight = window.innerHeight;
  $('#size').html(`Width: ${intViewportWidth} || Height: ${intViewportHeight}`);

  // Global datatables options.
  $.extend( $.fn.dataTable.defaults, {
    scrollY: 450,
    pageLength: 100
  });

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
  $('.tabs-panel').height( intViewportHeight - 250 );
}

// .
const display_error = ( msg ) => {
  $( '#dlg_error_msg' ).html( `${msg}` );
  $( '#dlg_error' ).foundation( 'open') ;
}

// Shows the loading spinner.
const loader_show = () => {
$('#content').LoadingOverlay('show', {
  image: "",
  background: 'rgba(255, 255, 255, 0.92)',
  fontawesome: 'fad fa-spinner fa-spin',
  fontawesomeColor: '#BB2525',
  zIndex: 1000
});
}

// Hide the loading spinner.
const loader_hide = () => {
  $('#content').LoadingOverlay('hide', true);
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

// Clears all rows from a table .
const clear_table = (table) => {
  let the_table = $(`#${table}`).DataTable();
  let the_row_count = the_table.data().count();

  if (the_table && the_row_count !== 0) {
    the_table.clear().draw();
  }
}

// Adds row to a table.
const add_row = (table, row) => {
  if ( table && row ) {
    let the_table = $(`#${table}`).DataTable();
    the_table.row.add(row).draw();
  }
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
const get_system_info = () => {
  loader_show();
    setTimeout(function(){
      let cpu_info   = '/proc/cpuinfo';
      let cpu_data   = fs.readFileSync( cpu_info, {encoding:'utf8', flag:'r'});
      $( '#cpu-info' ).append( cpu_data );
      
      let pinout      = run_shell( `pinout` );
      let pinout_data = pinout.stdout;
      $( '#pinout-info' ).append( pinout_data );
  
      let boot_info   = '/boot/config.txt';
      let boot_data   = fs.readFileSync( boot_info, {encoding:'utf8', flag:'r'});
      $( '#boot-info' ).append( boot_data );

      let ram       = run_shell( `free --mega` );
      let ram_data = ram.stdout;
      $( '#ram-info' ).append( ram_data );

      let disk       = run_shell( `df -h` );
      let disk_data  = disk.stdout;
      $( '#disk-info' ).append( disk_data );

      loader_hide();
    }, 750 );
}