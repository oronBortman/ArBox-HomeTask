# ArBox-HomeTask

## Usage
First run on your DB the following command to find what is the largest id:
select max(id) from 
(
  select MAX(id) AS id from product
 union 
  select MAX(id) AS id from management
) combined;

node index.cjs -i path_to_xlsx_file -c id_of_club -d largest_id_from_before

### Example
node index.cjs -i "jimalaya.xlsx" -c 2400
