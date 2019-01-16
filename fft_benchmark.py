import time
import json

import numpy as np


def main():
    n = 2048
    a = np.arange(n) + 1j*np.arange(n)
    t0 = time.time()
    for i in range(n_iter):
        np.fft.fft(a)
    print(f"time per loop: {(time.time() - t0)/n_iter:.7f}")


if __name__ == '__main__':
    main()
