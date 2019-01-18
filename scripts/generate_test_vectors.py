import os
import json

import numpy as np

cur_dir = os.path.dirname(os.path.abspath(__file__))
test_data_dir = os.path.join(cur_dir, 'test', 'data')


def main():
    file_name = 'test_vectors.json'
    file_path = os.path.join(test_data_dir, file_name)
    # n = [8, 32, 2048, 8192, 32768, 131072]
    n = [8, 32, 512, 2048, 8192, 32768]
    res = {}
    for val in n:
        x = np.random.rand(val) + 1j*np.random.rand(val)
        # x = np.arange(val) + 1j*np.arange(val)
        f = np.fft.fft(x)
        res[val] = {
            'in': [[v.real, v.imag] for v in x],
            'out': [[v.real, v.imag] for v in f]
        }

    with open(file_path, 'w') as f:
        json.dump(res, f)


if __name__ == '__main__':
    main()
