
from flask import Flask, render_template



app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html")

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
