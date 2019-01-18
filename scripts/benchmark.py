import time
import json

import numpy as np


def main():
    # n = 8192
    n_iter = 2000
    sizes = [32768]
    sizes = [512, 2048]
    for n in sizes:
        a = np.random.rand(n) + 1j*np.random.rand(n)
        # a = np.arange(n) + 1j*np.arange(n)
        t0 = time.time()
        for i in range(n_iter):
            np.fft.fft(a)
        delta = time.time() - t0
        print(f"size: {n}: {delta:.7f} sec, {delta/n_iter:.7f} per loop, {n_iter/delta:.7f} iter per second")


if __name__ == '__main__':
    main()
