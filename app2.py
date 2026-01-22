import matplotlib.pyplot as plt
import numpy as np
import matplotlib.animation as animation

def cross(o, a, b):
    return (a[0]-o[0])*(b[1]-o[1]) - (a[1]-o[1])*(b[0]-o[0])

def graham_scan(points):
    """Implementação do Graham Scan"""
    points = sorted(points, key=lambda p: (p[1], p[0]))
    pivot = points[0]
    
    # Ordenar por ângulo polar
    sorted_pts = sorted(points[1:], 
                       key=lambda p: (np.arctan2(p[1]-pivot[1], p[0]-pivot[0]),
                                     -np.linalg.norm(p-pivot)))
    
    hull = [pivot, sorted_pts[0]]
    
    for point in sorted_pts[1:]:
        while len(hull) > 1 and cross(hull[-2], hull[-1], point) <= 0:
            hull.pop()
        hull.append(point)
    
    return hull

# Configuração
np.random.seed(42)
points = np.random.rand(15, 2) * 8 - 4
hull = graham_scan(points)
hull.append(hull[0])  # Fechar polígono
hull = np.array(hull)

# Animação
fig, ax = plt.subplots(figsize=(8, 8))
ax.set_xlim(-5, 5)
ax.set_ylim(-5, 5)
ax.set_title("Graham Scan - Fecho Convexo")

scat = ax.scatter(points[:,0], points[:,1], c='blue', s=50)
hull_line, = ax.plot([], [], 'r-', linewidth=2)

def animate(i):
    if i < len(hull):
        hull_line.set_data(hull[:i+1, 0], hull[:i+1, 1])
    return hull_line,

ani = animation.FuncAnimation(fig, animate, frames=len(hull)+10, 
                            interval=500, blit=True, repeat=False)
plt.show()