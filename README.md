# ArBox-HomeTask

## Usage
1. Run on your DB the following command to find what is the largest id:

```sql
SELECT MAX(id) FROM 
( 
  SELECT MAX(id) AS id FROM product
  UNION 
  SELECT MAX(id) AS id FROM memberships
) COMBINED;
```

2. Run on your DB the following command to find what is the largest user_id:

```sql
SELECT MAX(user_id) FROM memberships
```

3. Run the following command:
```
npm install
```

4. Run the following command:
``` 
node index.cjs -i path_to_xlsx_file -c id_of_club -d largest_id_from_tables -u largest_user_id
```
### Example
```
node index.cjs -i "jimalaya.xlsx" -c 2400 -d 3 -u 2
```
