(module

  (import "console" "log" (func $log_i32 (param i32) (param i32)))
  (import "console" "log" (func $log_f64 (param f64) (param f64)))
  (import "math" "exp" (func $exp (param f64) (result f64)))
  (import "math" "log2" (func $log2_i32 (param i32) (result i32)))
  ;; (memory (import "js" "mem") 1)

  (memory (export "memory") 100)

  (func $reverseSingleBit (param $x i32) (param $mask i32) (param $int i32) (result i32)
      ;; x = ((x & mask) << int) | ((x >> int) & mask)
      (set_local $x
          (i32.or
              (i32.shl
                  (i32.and
                      (get_local $x)
                      (get_local $mask))
                  (get_local $int)
              )
              (i32.and
                  (i32.shr_s
                      (get_local $x)
                      (get_local $int)
                  )
                  (get_local $mask)
              )
          )
      )
      (get_local $x)
  )

  (func $shiftReverse (param $x i32) (param $n i32) (result i32)
    (set_local $x
        (i32.or
            (i32.shl
                (i32.and
                    (get_local $x)
                    (i32.const 0x55555555))
                (i32.const 1)
            )
            (i32.and
                (i32.shr_s
                    (get_local $x)
                    (i32.const 1)
                )
                (i32.const 0x55555555)
            )
        ))
    (set_local $x
        (i32.or
            (i32.shl
                (i32.and
                    (get_local $x)
                    (i32.const 0x33333333))
                (i32.const 2)
            )
            (i32.and
                (i32.shr_s
                    (get_local $x)
                    (i32.const 2)
                )
                (i32.const 0x33333333)
            )
        ))
    (set_local $x
        (i32.or
            (i32.shl
                (i32.and
                    (get_local $x)
                    (i32.const 0x0f0f0f0f))
                (i32.const 4)
            )
            (i32.and
                (i32.shr_s
                    (get_local $x)
                    (i32.const 4)
                )
                (i32.const 0x0f0f0f0f)
            )
        ))
    (set_local $x
        (i32.or
            (i32.shl
                (i32.and
                    (get_local $x)
                    (i32.const 0x00ff00ff))
                (i32.const 8)
            )
            (i32.and
                (i32.shr_s
                    (get_local $x)
                    (i32.const 8)
                )
                (i32.const 0x00ff00ff)
            )
        ))

    (set_local $x
        (i32.or
            (i32.shl
                (get_local $x)
                (i32.const 16)
            )
            (i32.shr_s
                (get_local $x)
                (i32.const 16)
            )
        ))

    (set_local $x
        (i32.shr_u
            (get_local $x)
            (i32.sub
                (i32.const 32)
                (get_local $n)
            )
        )
    )
    (get_local $x)
  )

  (func $reverseBits (param $x i32) (result i32)

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
    ;; (set_local $mask (i32.const 0x55555555))
    (set_local $x
        (call $reverseSingleBit (get_local $x) (i32.const 0x55555555) (i32.const 1)))
    ;; (set_local $mask (i32.const 0x33333333))
    (set_local $x
        (call $reverseSingleBit (get_local $x) (i32.const 0x33333333) (i32.const 2)))
    ;; (set_local $mask (i32.const 0x0f0f0f0f))
    (set_local $x
        (call $reverseSingleBit (get_local $x) (i32.const 0x0f0f0f0f) (i32.const 4)))
    ;; (set_local $mask (i32.const 0x00ff00ff))
    (set_local $x
        (call $reverseSingleBit (get_local $x) (i32.const 0x00ff00ff) (i32.const 8)))

    (set_local $x
        (i32.or
            (i32.shl
                (get_local $x)
                (i32.const 16)
            )
            (i32.shr_s
                (get_local $x)
                (i32.const 16)
            )
        ))

    (get_local $x)
  )

  (func $sin_f64 (param $x f64) (result f64)
    (local $n_lsb_PI i32)
    (local $n_lsb_PI_2 i32)
    (local $n_f64 f64)
    (local $x_sqr f64)
    (local $y f64)

    ;; (call $print_f64 (local.get $x))

    (local.set $n_f64
      (f64.floor
        (f64.div
          (local.get $x)
          (global.get $PI_2)
        )
      )
    )

    ;; (call $print_f64 (local.get $n_f64))

    (local.set $n_lsb_PI_2
      (i32.and
        (i32.trunc_f64_s
          (local.get $n_f64)
        )
        (i32.const 1)
      )
    )

    (local.set $n_lsb_PI
      (i32.and
        (i32.trunc_f64_s
          (f64.floor
            (f64.div
              (local.get $x)
              (global.get $PI)
            )
          )
        )
        (i32.const 1)
      )
    )

    (local.set $x
      (f64.sub
        (local.get $x)
        (f64.mul
          (local.get $n_f64)
          (global.get $PI_2)
        )
      )
    )

    ;; (call $print_f64 (local.get $x))

    (if
      (i32.eq
        (local.get $n_lsb_PI_2)
        (i32.const 1)
      )
      (then
        (local.set $x
          (f64.sub
            (global.get $PI_2)
            (local.get $x)
          )
        )
      )
    )

    ;; (call $print_f64 (local.get $x))

    (local.set $x_sqr
      (f64.mul
        (local.get $x)
        (local.get $x)
      )
    )
    ;; first order term
    (local.set $y (local.get $x))

    ;; third order term
    (local.set $x
      (f64.mul
        (local.get $x)
        (local.get $x_sqr)
      )
    )
    (local.set $y
      (f64.sub
        (local.get $y)
        (f64.div
          (local.get $x)
          (f64.const 6.0)
        )
      )
    )

    ;; fifth order term
    (local.set $x
      (f64.mul
        (local.get $x)
        (local.get $x_sqr)
      )
    )
    (local.set $y
      (f64.add
        (local.get $y)
        (f64.div
          (local.get $x)
          (f64.const 120.0)
        )
      )
    )

    ;; seventh order term
    ;; (local.set $x
    ;;   (f64.mul
    ;;     (local.get $x)
    ;;     (local.get $x_sqr)
    ;;   )
    ;; )
    ;; (local.set $y
    ;;   (f64.sub
    ;;     (local.get $y)
    ;;     (f64.div
    ;;       (local.get $x)
    ;;       (f64.const 5040.0)
    ;;     )
    ;;   )
    ;; )
    ;;
    ;; ;; ninth order term
    ;; (local.set $x
    ;;   (f64.mul
    ;;     (local.get $x)
    ;;     (local.get $x_sqr)
    ;;   )
    ;; )
    ;; (local.set $y
    ;;   (f64.add
    ;;     (local.get $y)
    ;;     (f64.div
    ;;       (local.get $x)
    ;;       (f64.const 362880.0)
    ;;     )
    ;;   )
    ;; )

    (if
      (i32.eq
        (local.get $n_lsb_PI)
        (i32.const 1)
      )
      (then
        (local.set $y
          (f64.mul
            (local.get $y)
            (f64.const -1)
          )
        )
      )
    )

    (local.get $y)
  )

  (func $cos_f64 (param $x f64) (result f64)
    ;; (local $y f64)
    ;; (local.set $y (f64.const 1.0))
    ;; (local.set $x
    ;;   (f64.mul
    ;;     (local.get $x)
    ;;     (local.get $x)
    ;;   )
    ;; )
    ;; (local.set $y
    ;;   (f64.sub)
    ;; )
    ;; cos is just sin shifted by PI/2
    (local.set $x
      (f64.add
        (local.get $x)
        (global.get $PI_2)
      )
    )
    (call $sin_f64 (local.get $x))
  )


  (func $shiftBit (param $bit i32) (param $n i32) (result i32)

    ;; bit >>> (32 - n)

    (set_local $bit
        (i32.shr_u
            (get_local $bit)
            (i32.sub
                (i32.const 32)
                (get_local $n)
            )
        )
    )
    (get_local $bit)
  )

  ;; (func $shiftReverse (param $bit i32) (param $n i32) (result i32)
  ;;   (set_local $bit
  ;;     (call $shiftBit
  ;;       (call $reverseBits
  ;;         (get_local $bit)
  ;;       )
  ;;       (get_local $n)
  ;;     )
  ;;   )
  ;;   (get_local $bit)
  ;; )

  (func $fftPermute (param $n i32) (param $p i32)
    (local $bytesPerComplex i32)
    (local $bytesPerDouble i32)
    (local $nComplex i32)
    ;; (local $idxByte i32)
    (local $idx i32)
    (local $end i32)
    (local $shiftedIdx i32)
    (local $offsetIdx i32)
    (local $shiftedIdxByte i32)
    (local $offsetIdxByte i32)

    (set_local $bytesPerComplex (i32.const 16)) ;; 8 bytes * 2 for complex
    (set_local $bytesPerDouble (i32.const 8))
    (set_local $nComplex (i32.mul (get_local $n) (i32.const 2)))
    ;; (set_local $idxByte (i32.const 0))
    (set_local $idx (i32.const 0))
    (set_local $end (i32.mul (get_local $n) (get_local $bytesPerComplex)))
    (set_local $shiftedIdx (i32.const 0))
    (set_local $offsetIdx (i32.const 0))
    (set_local $shiftedIdxByte (i32.const 0))
    (set_local $offsetIdxByte (i32.const 0))

    ;; initialize
    (block
        (loop
            (set_local $shiftedIdxByte
              (i32.mul
                (call $shiftReverse
                  (get_local $idx)
                  (get_local $p))
                (get_local $bytesPerComplex)))

            ;; (set_local $shiftedIdx
            ;;     (call $shiftBit
            ;;         (call $reverseBits (get_local $idx))
            ;;         (get_local $p)))
            ;;
            ;; (set_local $shiftedIdxByte
            ;;     (i32.mul
            ;;         (get_local $shiftedIdx)
            ;;         (get_local $bytesPerComplex)))

            (set_local $offsetIdx
                (i32.add
                    (get_local $nComplex)
                    (i32.mul
                        (get_local $idx)
                        (i32.const 2))))

            (set_local $offsetIdxByte
                (i32.mul (get_local $offsetIdx) (get_local $bytesPerDouble)))

            ;; (call $log_i32 (get_local $idx) (get_local $idx))
            ;; (call $log_f64 (f64.load (get_local $offsetIdxByte)) (f64.load (get_local $shiftedIdxByte)))

            (f64.store
                (get_local $offsetIdxByte)
                (f64.load
                    (get_local $shiftedIdxByte)))

            (set_local $shiftedIdxByte
                (i32.add (get_local $shiftedIdxByte) (get_local $bytesPerDouble)))
            (set_local $offsetIdxByte
                (i32.add (get_local $offsetIdxByte) (get_local $bytesPerDouble)))

            (f64.store
                (get_local $offsetIdxByte)
                (f64.load
                    (get_local $shiftedIdxByte)))

            (set_local $idx (i32.add (get_local $idx) (i32.const 1)))
            ;; (set_local $idxByte (i32.add (get_local $idxByte) (get_local $bytesPerComplex)))
            (br_if 1 (i32.eq (get_local $idx) (get_local $n)))
            (br 0)
        )
    )
  )

  (func $fft (param $n i32) (param $inverse i32)
    (local $p i32)

    (set_local $p (call $log2_i32 (get_local $n)))

    (call $fftPermute (get_local $n) (get_local $p))
  )

  (export "exp" (func $exp))
  (export "reverseBits" (func $reverseBits))
  (export "shiftBit" (func $shiftBit))
  (export "shiftReverse" (func $shiftReverse))
  (export "fftPermute" (func $fftPermute))
  (export "fft" (func $fft))
)
