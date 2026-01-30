import fdb
import csv

con = fdb.connect(
    dsn='C:\\Syspdv\\Syspdv_srv.fdb',
    user='SYSDBA',
    password='masterkey',
    charset='UTF8'
)

cur = con.cursor()
cur.execute("SELECT * FROM FUNCIONARIO")

colunas = [desc[0] for desc in cur.description]

with open('funcionario.csv', 'w', newline='', encoding='utf-8') as arquivo:
    writer = csv.writer(arquivo)
    writer.writerow(colunas)
    
    for linha in cur:
        writer.writerow(linha)

cur.close()
con.close()
