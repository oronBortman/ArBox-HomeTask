class col_not_from_excel {
  constructor(col_name, val, incremented) {
    this.col_name = col_name;
    this.val = val;
    this.inc = incremented;
  }
}

XLSX = require('xlsx');

//Arguments
var argv = require('minimist')(process.argv.slice(2));
var info_path = argv.i;
var club_id = argv.c;
var last_user_id_in_db = argv.u;

//Declare consts
TABLE_NAME_MEMBERSHIPS = "memberships";
TABLE_NAME_USERS = "users";

//Rread info xlsx
var workbook = XLSX.readFile(info_path);

create_query_for_workbook(workbook);

function create_query_for_workbook(workbook)
{
  for(i=0; i<workbook.SheetNames.length; i++)
  {
    var sheet_name = workbook.SheetNames[i];
    var worksheet = workbook.Sheets[sheet_name];
    create_query_per_sheet(worksheet);
  }
}

function create_query_per_sheet(worksheet)
{
  //Add to membership table
  var membership_table_cols = {};
  var users_table_cols = {};
  var membership_table_cols_not_excel = new Array();
  var users_table_cols_not_excel = new Array();
  var num_of_rows=calc_num_of_rows(worksheet);

  add_col_to_hash(users_table_cols, "email", worksheet);
  var duplicates = hasDuplicates(users_table_cols["email"], num_of_rows, worksheet)
  if(duplicates)
  {
    console.log("duplicate emails");
    return;
  }
  //Add cols to hash from excel
  add_col_to_hash(membership_table_cols, "membership_name", worksheet);
  add_col_to_hash(membership_table_cols, "start_date", worksheet);
  add_col_to_hash(membership_table_cols, "end_date", worksheet);
  add_col_to_hash(users_table_cols, "phone", worksheet);
  add_col_to_hash(users_table_cols, "first_name", worksheet);
  add_col_to_hash(users_table_cols, "last_name", worksheet);

  //Add cols that are not from excel
  membership_table_cols_not_excel.push(new col_not_from_excel("club_id", club_id, new Boolean(false)));
  users_table_cols_not_excel.push(new col_not_from_excel("user_id", last_user_id_in_db + 1, new Boolean(true)));


  //Build queries
  var query_membership = create_querys(membership_table_cols, TABLE_NAME_MEMBERSHIPS, num_of_rows, worksheet, membership_table_cols_not_excel);
  var query_users = create_querys(users_table_cols, TABLE_NAME_USERS, num_of_rows, worksheet, users_table_cols_not_excel);

  console.log(query_membership);
  console.log("\n");
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

function hasDuplicates(col, num_of_rows, worksheet) 
{
  seen = new Set();
  for(var i=2; i <= num_of_rows; i++)
  {
    val = get_val_by_col_row(worksheet, col, i);
    if(seen.has(val))
    {
      return true;
    }
    else
    {
      seen.add(val);
    }
  }
  return false;
}

function add_to_row_values_not_from_excel(table_cols_not_excel)
{
  var sql_query="";
  for(var j=0; j < table_cols_not_excel.length; j++)
  {
    sql_query += "'" + table_cols_not_excel[j].val + "'" + ",";
    if(table_cols_not_excel[j].inc == true)
    {
      table_cols_not_excel[j].val+=1;
    }
  }
  return sql_query;
}

function add_vals_to_row(table_cols, worksheet, i)
{
  sql_query="";
  for ( col_name in table_cols)
  {
    sql_query += "'" + get_val_by_col_row(worksheet, table_cols[col_name], i) + "'" + ",";
  }
  return sql_query
}

function add_rows(num_of_rows, table_cols, table_cols_not_excel, worksheet)
{
  sql_query="";
  for (let i = 2; i <= num_of_rows; i++) 
  {
    sql_query+="(";
    sql_query+=add_vals_to_row(table_cols, worksheet, i);
    sql_query+=add_to_row_values_not_from_excel(table_cols_not_excel);

    sql_query = sql_query.replace(/.$/,")");
    sql_query += "," + "\n";
  }
  return sql_query;
}

function add_first_row_not_from_excel(table_cols)
{
  sql_query="";
  for(var i=0; i < table_cols.length; i++)
  {
    sql_query += table_cols[i].col_name + ",";
  }
  return sql_query;
}

function add_first_row(table_cols)
{
  sql_query="";
  for ( col_name in table_cols)
  {
    sql_query += col_name + ",";
  }
  return sql_query;
}


function create_querys(table_cols,table_name, num_of_rows, worksheet, table_cols_not_excel)
{ 
  var sql_query = "INSERT INTO " + table_name + "(";
  
  sql_query += add_first_row(table_cols);
  
  sql_query += add_first_row_not_from_excel(table_cols_not_excel);
  
  sql_query = sql_query.replace(/.$/,")");
  sql_query += "\n";
  sql_query += "VALUES ";
  sql_query += add_rows(num_of_rows, table_cols,table_cols_not_excel, worksheet);
  sql_query = sql_query.replace(/\n*$/, "");
  sql_query = sql_query.replace(/.$/,"");
  sql_query+=";";
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

function remove_letters_from_str(str)
{
  return str.replace(/\D+/g, '');
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
  lastCellKeyName = worksheet["!ref"].split(":")[1];
  return remove_letters_from_str(lastCellKeyName)
}
