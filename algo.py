import random

lista = []
for i in range(5):
    num = random.randint(1, 100)
    lista.append(num)
print("Original:", lista)

qtd = len(lista)

# Vamos fazer várias passadas, até a lista ficar ordenada
for j in range(qtd - 1):  # número de passadas
    passador = 0
    passador_it = passador + 1
    
    while passador_it < qtd:  # compara cada par da lista
        if lista[passador] > lista[passador_it]:
            lista[passador], lista[passador_it] = lista[passador_it], lista[passador]
        passador += 1
        passador_it += 1
    print(f"Passada {j+1}:", lista)

print("Lista ordenada:", lista)
