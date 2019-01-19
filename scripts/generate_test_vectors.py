import os
import json

import numpy as np

cur_dir = os.path.dirname(os.path.abspath(__file__))
top_dir = os.path.dirname(cur_dir)
test_data_dir = os.path.join(top_dir, 'test', 'data')


def main():
    file_name = 'test_vectors.json'
    file_path = os.path.join(test_data_dir, file_name)
    # n = [8, 32, 2048, 8192, 32768, 131072]
    n = [8, 32, 512, 2048, 8192, 32768]
    res = {"complex": {},
           "real": {},
           "2d": {
                "complex": {},
                "real": {}
           }}

    for val in n:
        x = np.random.rand(val) + 1j*np.random.rand(val)
        # x = np.arange(val) + 1j*np.arange(val)
        f_c = np.fft.fft(x)
        f_r = np.fft.fft(x.real)
        res["complex"][val] = {
            'in': [v for c in x for v in [c.real, c.imag]],
            'out': [v for c in f_c for v in [c.real, c.imag]]
        }
        res["real"][val] = {
            "in": x.real.tolist(),
            "out": [v for c in f_r for v in [c.real, c.imag]]
        }

    n = [8, 32, 128, 256, 512]
    for val in n:
        input2d = (np.arange(val**2) + 1j*np.arange(val**2)).reshape((val, val))
        input2d_transpose = input2d.transpose()
        f_c_2d = np.fft.fft2(input2d)
        res['2d']['complex'][val] = {
            "in": [[v for c in row for v in [c.real, c.imag]] for row in input2d],
            "in_transpose": [[v for c in row for v in [c.real, c.imag]] for row in input2d_transpose],
            "out": [[v for c in row for v in [c.real, c.imag]] for row in f_c_2d]
        }

    with open(file_path, 'w') as f:
        json.dump(res, f)


if __name__ == '__main__':
    main()
