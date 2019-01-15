import time

import numpy as np

n = 2048
n_iter = 10
a = np.arange(n) + 1j*np.arange(n)

t0 = time.time()
for i in range(n_iter):
    np.fft.fft(a)
print(f"time per loop: {(time.time() - t0)/n_iter:.7f}")
