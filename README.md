# ArBox-HomeTask

## Usage
First run on your DB the following command to find what is the largest id:
SELECT max(id) from 

(
  
  SELECT MAX(id) AS id FROM product
 
 UNION 
  
  SELECT MAX(id) AS id FROM management

) COMBINED;

node index.cjs -i path_to_xlsx_file -c id_of_club -d largest_id_from_before

### Example
node index.cjs -i "jimalaya.xlsx" -c 2400
