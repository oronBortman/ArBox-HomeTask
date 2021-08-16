# ArBox-HomeTask

## Usage

1. Run on your db the following command to find what is the largest value of the column user_in in the table 'memberships':

```sql
SELECT MAX(user_id) FROM memberships
```

3. Run the following command:
```
npm install
```

4. Run the following command:
``` 
node index.cjs -i path_to_xlsx_file -c id_of_club -u largest_user_id
```
### Example
```
node index.cjs -i "jimalaya.xlsx" -c 2400 -u 2
```
