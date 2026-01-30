
from flask import Flask, render_template



app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html")



"""MATEMÁTICA """"""MATEMÁTICA """"""MATEMÁTICA """"""MATEMÁTICA """"""MATEMÁTICA """"""MATEMÁTICA """"""MATEMÁTICA """"""MATEMÁTICA """
 
@app.route("/fatorial")
def fatorial():
    return render_template("fatorial.html")



@app.route("/voronoi")
def voronoi():
    return render_template("voronoi.html")


@app.route("/delaunay")
def delaunay():
    return render_template("delaunay.html")

@app.route("/trees")
def trees():
    return render_template("trees.html")


@app.route("/gradient")
def gradient():
    return render_template("gradient.html")





@app.route("/fourier")
def fourier():
    return render_template("fourier_transform.html")


@app.route("/graphs")
def graphs():
    return render_template("graphs.html")


@app.route('/vector-fields')
def vector_fields():
    return render_template('vector_fields.html')

@app.route('/fibonacci')
def fibonacci():
    return render_template('fibonacci.html')


    
@app.route('/hanoi')
def hanoi():
    return render_template('hanoi.html')





"""ALGORITMOS DE ORDENÇÃO """"""ALGORITMOS DE ORDENÇÃO """"""ALGORITMOS DE ORDENÇÃO """"""ALGORITMOS DE ORDENÇÃO """"""ALGORITMOS DE ORDENÇÃO """"""ALGORITMOS DE ORDENÇÃO """


@app.route("/pilha")
def pilha_lista():
    return render_template("list_stack.html")


@app.route("/bubble")
def bubble_sort():
    return render_template("bubble_sort.html")



@app.route("/selection")
def selection_sort():
    return render_template("selection_sort.html")


@app.route("/insert")
def insertion_sort():
    return render_template("insertion_sort.html")


@app.route("/merge")
def merge_sort():
    return render_template("merge_sort.html")



@app.route("/quick")
def quick_sort():
    return render_template("quick_sort.html")


@app.route("/heap")
def heap_sort():
    return render_template("heap_sort.html")



@app.route("/counting")
def counting_sort():
    return render_template("counting_sort.html")


@app.route("/radix")
def radix_sort():
    
    return render_template("radix_sort.html")
    

"""LÓGICA""""""LÓGICA""""""LÓGICA""""""LÓGICA""""""LÓGICA""""""LÓGICA""""""LÓGICA""""""LÓGICA""""""LÓGICA"""


"""Problema do Caixeiro Viajante"""
@app.route("/tsp")
def tsp():
        return render_template("tsp.html")
    


@app.route("/knap")
def knapsack():
        return render_template("knapsack.html")
    



@app.route("/back")
def backtracking():
        return render_template("backtracking.html")
    


@app.route("/thread")
def threading():
        return render_template("thread.html")
    













# class GradientCalculator:
#     def compute_trajectory(self, func_name, start, lr, iters):
#         # Cálculos precisos com NumPy
#         x, y = start
#         trajectory = []
        
#         for i in range(iters):
#             grad = self.compute_gradient(func_name, x, y)
#             x -= lr * grad[0]
#             y -= lr * grad[1]
#             trajectory.append([float(x), float(y)])
        
#         # Gerar superfície uma vez
#         surface = self.generate_surface(func_name)
        
#         return {
#             'trajectory': trajectory,
#             'surface': surface,
#             'stats': {...}
#         }




if __name__ == "__main__":
    app.run(debug=True,host='192.168.25.200',port=5004)
