//node index.js -i "info.xls" -c "club_id"

const { exit } = require('yargs');
XLSX = require('xlsx');

//Arguments
var argv = require('minimist')(process.argv.slice(2));
var info_path = argv.i;
var club_id = argv.c;
var last_id_in_memberships_table = argv.d;
var last_user_id_in_db = argv.u;

//Declare consts
TABLE_NAME_MEMBERSHIPS = "memberships";
TABLE_NAME_USERS = "users";

//Rread info xlsx
var workbook = XLSX.readFile(info_path);
create_query_for_workbook(workbook);


function create_query_for_workbook(workbook)
{
  console.log(workbook.SheetNames.length);
  for(i=0; i<workbook.SheetNames.length; i++)
  {
    var sheet_name = workbook.SheetNames[i];
    var worksheet = workbook.Sheets[sheet_name];
    console.log(i);
    create_query_per_sheet(worksheet);
  }
}

function create_query_per_sheet(worksheet)
{
  var num_of_rows=calc_num_of_rows(worksheet);
  //Add to membership table
  var membership_table_cols = {};
  var membership_table = [];
  var users_table_cols = {};
  var user_table = [];

  add_col_to_hash(users_table_cols, "email", worksheet);
  var arr = add_vals_to_array(users_table_cols["email"], num_of_rows, worksheet);
  if(hasDuplicates(arr))
  {
    console.log("duplicate emails");
    exit();
  }

  //Add cols to hash
  add_col_to_hash(membership_table_cols, "membership_name", worksheet);
  add_col_to_hash(membership_table_cols, "start_date", worksheet);
  add_col_to_hash(membership_table_cols, "end_date", worksheet);
  add_col_to_hash(users_table_cols, "phone", worksheet);
  add_col_to_hash(users_table_cols, "first_name", worksheet);
  add_col_to_hash(users_table_cols, "last_name", worksheet);

  //Add values to hash table
  add_vals_to_table_hash(membership_table_cols, membership_table, num_of_rows, worksheet );
  add_incriment_vals_to_table_hash("id", last_id_in_memberships_table, membership_table, num_of_rows, worksheet)
  add_incriment_vals_to_table_hash("user_id", last_user_id_in_db, membership_table, num_of_rows, worksheet);

  add_vals_to_table_hash(users_table_cols, user_table, num_of_rows, worksheet );
  add_val_to_table_hash_key("club_id", club_id, user_table, num_of_rows, worksheet);
  add_incriment_vals_to_table_hash("id", last_id_in_memberships_table, user_table, num_of_rows, worksheet)

  //create Querys
  var query_membership = create_querys(membership_table, TABLE_NAME_MEMBERSHIPS, num_of_rows, worksheet);
  var query_users = create_querys(user_table, TABLE_NAME_USERS, num_of_rows, worksheet);
  console.log(query_membership);
  console.log(query_users);

}

//Functions
function add_col_to_hash(table_cols, str, worksheet)
{
  var key = find_key_of_val(str,worksheet);
  check_valid_col_name(str, key);
  var key = remove_digits_from_str(key);
  table_cols[str] = key;
}

function add_incriment_vals_to_table_hash(key, val, table_array, num_of_rows, worksheet)
{ 
  for (let i=0; i < num_of_rows-1; i++) 
  {
    var row_hash_vals = table_array[i];
    row_hash_vals[key] = val;
    val+=1;
  }
}

function add_val_to_table_hash_key(key, val, table_array, num_of_rows, worksheet)
{ 
  for (let i=0; i < num_of_rows-1; i++) 
  {
    var row_hash_vals = table_array[i];
    //console.log(row_hash_vals);
    row_hash_vals[key] = val;
    //console.log(row_hash_vals);
  }
}

function add_vals_to_table_hash(table_cols, table_array, num_of_rows, worksheet)
{ 
  for (let i = 2; i <= num_of_rows; i++) 
  {
    row_hash_vals = {};
    for ( key_name in table_cols)
    {
      var val = get_val_by_col_row(worksheet, table_cols[key_name], String(i));
      row_hash_vals[key_name] = val;
    }
    table_array.push(row_hash_vals);
  }
}


function add_vals_to_array(table_col, num_of_rows, worksheet)
{ 
  var arr = [];
  for (let i = 2; i <= num_of_rows; i++) 
  {
    var val = get_val_by_col_row(worksheet, table_col, String(i));
    arr.push(val);
  }
  return arr;
}

function hasDuplicates(array) {
  return (new Set(array)).size !== array.length;
}

function create_querys(table_array, table_name, num_of_rows, worksheet)
{ 
  var sql_query = "INSERT INTO " + table_name + "(";
  for ( key_name in table_array[0])
  {
    sql_query += key_name + ",";
  }
  sql_query = sql_query.replace(/.$/,")");
  sql_query += "\n";
  sql_query += "VALUES ";

  for (let i = 0; i < num_of_rows - 1; i++) 
  {
    var hash_row = table_array[i];
    sql_query+="(";
    for ( key_name in hash_row)
    {
      sql_query += "'" + hash_row[key_name] + "'" + ",";
    }
    sql_query = sql_query.replace(/.$/,")");
    sql_query += "," + "\n";
  }
  sql_query = sql_query.replace(/\n*$/, "");
  sql_query = sql_query.replace(/.$/,"");
  return sql_query;
}

function get_val_by_col_row(worksheet, col, row)
{
  var cel_key =  col + row;
  var cel_val = worksheet[cel_key].w;
  return cel_val;
}

function check_valid_col_name(col_name, val)
{
  if(val == undefined)
  {
    console.log("error: col " + col_name + " isn't defined");
    exit();
  }
}

function remove_digits_from_str(str)
{
  return str.replace(/[0-9]/g, '');
}

function find_key_of_val(str, worksheet) 
{
  for(var k in worksheet)
  {
    var val = String(worksheet[k].v);

   if(k != "!ref" && k != "!margins" && val.includes(str))
    {
      return k;
    }
  }
}

function calc_num_of_rows(worksheet)
{
  num_of_rows=0;
  for(var k in worksheet)
  {
    if(k.includes('A'))
    {
      num_of_rows+=1;
    }
  }
  return num_of_rows;
}
