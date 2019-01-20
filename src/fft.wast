(module

  (import "console" "log" (func $print_i32 (param i32)))
  (import "console" "log" (func $print_f64 (param f64)))
  (import "console" "logx2" (func $print2_f64 (param f64 f64)))
  (import "console" "logx2" (func $print2_i32 (param i32 i32)))
  (import "performance" "now" (func $now (result f64)))
  (import "math" "cos" (func $cos (param f64) (result f64)))
  (import "math" "sin" (func $sin (param f64) (result f64)))
  (import "math" "log2" (func $log2_i32 (param i32) (result i32)))
  (import "math" "PI" (global $PI f64))
  (import "math" "PI_2" (global $PI_2 f64))

  (memory (export "memory") 100)

  (func $reverseSingleBit (param $x i32) (param $mask i32) (param $int i32) (result i32)
      ;; x = ((x & mask) << int) | ((x >> int) & mask)
      (local.set $x
          (i32.or
              (i32.shl
                  (i32.and
                      (local.get $x)
                      (local.get $mask))
                  (local.get $int)
              )
              (i32.and
                  (i32.shr_s
                      (local.get $x)
                      (local.get $int)
                  )
                  (local.get $mask)
              )
          )
      )
      (local.get $x)
  )


  (func $reverse_bits (param $x i32) (result i32)

    ;; var mask = 0x55555555; // 0101...
    ;; i = ((i & mask) << 1) | ((i >> 1) & mask)
    ;; mask = 0x33333333 // 0011...
    ;; i = ((i & mask) << 2) | ((i >> 2) & mask)
    ;; mask = 0x0f0f0f0f // 00001111...
    ;; i = ((i & mask) << 4) | ((i >> 4) & mask)
    ;; mask = 0x00ff00ff // 0000000011111111...
    ;; i = ((i & mask) << 8) | ((i >> 8) & mask)
    ;; // 00000000000000001111111111111111 no need for mask
    ;; i = (i << 16) | (i >> 16)

    ;; (local $mask i32)
    ;; (local.set $mask (i32.const 0x55555555))
    (local.set $x
        (call $reverseSingleBit (local.get $x) (i32.const 0x55555555) (i32.const 1)))
    ;; (local.set $mask (i32.const 0x33333333))
    (local.set $x
        (call $reverseSingleBit (local.get $x) (i32.const 0x33333333) (i32.const 2)))
    ;; (local.set $mask (i32.const 0x0f0f0f0f))
    (local.set $x
        (call $reverseSingleBit (local.get $x) (i32.const 0x0f0f0f0f) (i32.const 4)))
    ;; (local.set $mask (i32.const 0x00ff00ff))
    (local.set $x
        (call $reverseSingleBit (local.get $x) (i32.const 0x00ff00ff) (i32.const 8)))

    (local.set $x
        (i32.or
            (i32.shl
                (local.get $x)
                (i32.const 16)
            )
            (i32.shr_s
                (local.get $x)
                (i32.const 16)
            )
        ))

    (local.get $x)
  )

  (func $shift_bit (param $bit i32) (param $n i32) (result i32)

    ;; bit >>> (32 - n)

    (local.set $bit
        (i32.shr_u
            (local.get $bit)
            (i32.sub
                (i32.const 32)
                (local.get $n)
            )
        )
    )
    (local.get $bit)
  )

  (func $shift_reverse (param $bit i32) (param $n i32) (result i32)
    (local.set $bit
      (call $shift_bit
        (call $reverse_bits
          (local.get $bit)
        )
        (local.get $n)
      )
    )
    (local.get $bit)
  )

  (func $fft_permute_c (param $n i32) (param $p i32)
    (local $bytes_per_complex i32)
    (local $bytes_per_double i32)
    (local $nComplex i32)
    (local $idx i32)
    (local $end i32)
    (local $shiftedIdx i32)
    (local $offsetIdx i32)
    (local $shiftedIdxByte i32)
    (local $offsetIdxByte i32)

    (local.set $bytes_per_complex (i32.const 16)) ;; 8 bytes * 2 for complex
    (local.set $bytes_per_double (i32.const 8))
    (local.set $nComplex (i32.mul (local.get $n) (i32.const 2)))
    ;; (local.set $idxByte (i32.const 0))
    (local.set $idx (i32.const 0))
    (local.set $end (i32.mul (local.get $n) (local.get $bytes_per_complex)))
    (local.set $shiftedIdx (i32.const 0))
    (local.set $offsetIdx (i32.const 0))
    (local.set $shiftedIdxByte (i32.const 0))
    (local.set $offsetIdxByte (i32.const 0))

    ;; initialize
    (block
        (loop
            ;; (local.set $shiftedIdxByte
            ;;   (i32.mul
            ;;     (call $shift_reverse
            ;;       (local.get $idx)
            ;;       (local.get $p))
            ;;     (local.get $bytes_per_complex)))

            (local.set $shiftedIdx
                (call $shift_bit
                    (call $reverse_bits (local.get $idx))
                    (local.get $p)))

            (local.set $shiftedIdxByte
                (i32.mul
                    (local.get $shiftedIdx)
                    (local.get $bytes_per_complex)))

            (local.set $offsetIdx
                (i32.add
                    (local.get $nComplex)
                    (i32.mul
                        (local.get $idx)
                        (i32.const 2))))

            (local.set $offsetIdxByte
                (i32.mul (local.get $offsetIdx) (local.get $bytes_per_double)))

            ;; (call $print_i32 (local.get $idx))
            ;; (call $print_i32 (local.get $idx))
            ;; (call $print_f64 (f64.load (local.get $offsetIdxByte)))
            ;; (call $print_f64 (f64.load (local.get $shiftedIdxByte)))

            (f64.store
                (local.get $offsetIdxByte)
                (f64.load
                    (local.get $shiftedIdxByte)))

            (local.set $shiftedIdxByte
                (i32.add (local.get $shiftedIdxByte) (local.get $bytes_per_double)))
            (local.set $offsetIdxByte
                (i32.add (local.get $offsetIdxByte) (local.get $bytes_per_double)))

            (f64.store
                (local.get $offsetIdxByte)
                (f64.load
                    (local.get $shiftedIdxByte)))

            (local.set $idx (i32.add (local.get $idx) (i32.const 1)))
            (br_if 1 (i32.eq (local.get $idx) (local.get $n)))
            (br 0)
        )
    )
  )

  (func $complex_mul_re (param $re0 f64) (param $im0 f64) (param $re1 f64) (param $im1 f64) (result f64)
    (f64.sub
      (f64.mul
        (local.get $re0)
        (local.get $re1)
      )
      (f64.mul
        (local.get $im0)
        (local.get $im1)
      )
    )
  )

  (func $complex_mul_im (param $re0 f64) (param $im0 f64) (param $re1 f64) (param $im1 f64) (result f64)
    (f64.add
      (f64.mul
        (local.get $re0)
        (local.get $im1)
      )
      (f64.mul
        (local.get $im0)
        (local.get $re1)
      )
    )
  )

  (func $fft_c2c (param $n i32) (param $inverse f64)

    (local $log_n i32)

    (local $incr i32)
    (local $incr_2 i32)
    (local $theta f64)
    (local $theta_re f64)
    (local $theta_im f64)
    (local $omega_re f64)
    (local $omega_im f64)
    (local $even_re f64)
    (local $even_im f64)
    (local $even_idx i32)
    (local $even_idx_bytes_re i32)
    (local $even_idx_bytes_im i32)
    (local $odd_re f64)
    (local $odd_im f64)
    (local $odd_idx i32)
    (local $odd_idx_bytes_re i32)
    (local $odd_idx_bytes_im i32)
    (local $temp_re f64)

    ;; loop counters
    (local $p_idx i32)
    (local $offset_idx i32)
    (local $k_idx i32)

    ;; ;; result array offset
    (local $res_offset i32)

    ;; the following are for profiling
    (local $t0 f64)
    (local $delta f64)

    (local $bytes_per_complex i32)
    (local $bytes_per_double i32)

    (local.set $log_n (call $log2_i32 (local.get $n)))

    (local.set $res_offset
      (i32.mul
        (local.get $n)
        (i32.const 2)
      )
    )

    (local.set $bytes_per_complex (i32.const 16)) ;; 8 bytes * 2 for complex
    (local.set $bytes_per_double (i32.const 8))


    ;; (local.set $t0 (call $now))
    (call $fft_permute_c (local.get $n) (local.get $log_n))
    ;; (local.set $delta
    ;;   (f64.sub
    ;;     (call $now)
    ;;     (local.get $t0)
    ;;   )
    ;; )
    ;; ($call $print_f64 (local.get $delta))
    (local.set $p_idx (i32.const 1))

    (block
      (loop
        ;; (call $print_i32 ($local.get $p_idx))
        (local.set $offset_idx (i32.const 0))
        (local.set $incr
          (i32.shl
            (i32.const 1)
            (local.get $p_idx)))

        (local.set $incr_2
          (i32.div_s
            (local.get $incr)
            (i32.const 2)))

        (local.set $theta
          (f64.div
            (f64.mul
              (f64.mul
                (local.get $inverse)
                (f64.const 2)
              )
              (global.get $PI)
            )
            ;; (f64.convert_s_i32 (local.get $incr))
            (f64.convert_i32_s (local.get $incr))
          )
        ) ;; inverse*2*PI / incr
        ;; (local.set $theta_re (call $cos_f64 (local.get $theta)))
        ;; (local.set $theta_im (call $sin_f64 (local.get $theta)))

        (local.set $theta_re (call $cos (local.get $theta)))
        (local.set $theta_im (call $sin (local.get $theta)))

        ;; (call $print2_f64 (local.get $theta_re) (local.get $theta_im))

        (block
          (loop
            (local.set $k_idx (i32.const 0))
            (local.set $omega_re (f64.const 1))
            (local.set $omega_im (f64.const 0))
            (block
              (loop
                (local.set $even_idx
                  (i32.add
                    (local.get $offset_idx)
                    (local.get $k_idx)
                  )
                )
                (local.set $odd_idx
                  (i32.add
                    (local.get $even_idx)
                    (local.get $incr_2)
                  )
                )

                ;; (call $print2_i32 (local.get $even_idx) (local.get $odd_idx))

                (local.set $even_idx_bytes_re
                  (i32.mul
                    (i32.add
                      (i32.mul
                        (local.get $even_idx)
                        (i32.const 2)
                      )
                      (local.get $res_offset)
                    )
                    (local.get $bytes_per_double)
                  )
                )
                (local.set $even_idx_bytes_im
                  (i32.add
                    (local.get $even_idx_bytes_re)
                    (local.get $bytes_per_double)
                  )
                )
                (local.set $odd_idx_bytes_re
                  (i32.mul
                    (i32.add
                      (i32.mul
                        (local.get $odd_idx)
                        (i32.const 2)
                      )
                      (local.get $res_offset)
                    )
                    (local.get $bytes_per_double)
                  )
                )
                (local.set $odd_idx_bytes_im
                  (i32.add
                    (local.get $odd_idx_bytes_re)
                    (local.get $bytes_per_double)
                  )
                )

                (local.set $even_re (f64.load (local.get $even_idx_bytes_re)))
                (local.set $even_im (f64.load (local.get $even_idx_bytes_im)))
                (local.set $odd_re (f64.load (local.get $odd_idx_bytes_re)))
                (local.set $odd_im (f64.load (local.get $odd_idx_bytes_im)))

                ;; (call $print2_f64 (local.get $even_re) (local.get $even_im))
                ;; (call $print2_f64 (local.get $odd_re) (local.get $odd_im))


                (local.set $temp_re (call $complex_mul_re (local.get $odd_re) (local.get $odd_im) (local.get $omega_re) (local.get $omega_im)))
                (local.set $odd_im (call $complex_mul_im (local.get $odd_re) (local.get $odd_im) (local.get $omega_re) (local.get $omega_im)))
                (local.set $odd_re (local.get $temp_re))

                (local.set $temp_re (call $complex_mul_re (local.get $omega_re) (local.get $omega_im) (local.get $theta_re) (local.get $theta_im)))
                (local.set $omega_im (call $complex_mul_im (local.get $omega_re) (local.get $omega_im) (local.get $theta_re) (local.get $theta_im)))
                (local.set $omega_re (local.get $temp_re))

                ;; (call $print2_f64 (local.get $omega_re) (local.get $omega_im))

                (f64.store
                  (local.get $even_idx_bytes_re)
                  (f64.add
                    (local.get $even_re)
                    (local.get $odd_re)
                  )
                )

                (f64.store
                  (local.get $even_idx_bytes_im)
                  (f64.add
                    (local.get $even_im)
                    (local.get $odd_im)
                  )
                )

                (f64.store
                  (local.get $odd_idx_bytes_re)
                  (f64.sub
                    (local.get $even_re)
                    (local.get $odd_re)
                  )
                )

                (f64.store
                  (local.get $odd_idx_bytes_im)
                  (f64.sub
                    (local.get $even_im)
                    (local.get $odd_im)
                  )
                )

                (local.set $k_idx (i32.add (local.get $k_idx) (i32.const 1)))
                (br_if 1 (i32.eq (local.get $k_idx) (local.get $incr_2)))
                (br 0)
              )
            )
            (local.set $offset_idx (i32.add (local.get $offset_idx) (local.get $incr)))
            (br_if 1 (i32.eq (local.get $offset_idx) (local.get $n)))
            (br 0)
          ) ;; var offset = 0; offset < n; offset += incr
        )
        (local.set $p_idx (i32.add (local.get $p_idx) (i32.const 1)))
        (br_if 1 (i32.eq (local.get $p_idx) (i32.add (local.get $log_n) (i32.const 1))))
        (br 0)
      ) ;; loop for (var p = 1; p <= log_n; p++)
    )
  )
  ;; (func $fft2d_c2c )
  
  (export "reverse_bits" (func $reverse_bits))
  (export "shift_bit" (func $shift_bit))
  (export "shift_reverse" (func $shift_reverse))
  (export "fft_permute_c" (func $fft_permute_c))
  (export "complex_mul_re" (func $complex_mul_re))
  (export "complex_mul_im" (func $complex_mul_im))
  (export "fft_c2c" (func $fft_c2c))
)
