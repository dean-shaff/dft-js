(module

  (import "console" "log" (func $log_i32 (param i32 i32)))
  (import "console" "log" (func $log_f64 (param f64 f64)))
  (import "math" "exp" (func $exp (param f64) (result f64)))
  (import "math" "log2" (func $log2_i32 (param i32) (result i32)))

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

  (func $shiftBit (param $bit i32) (param $n i32) (result i32)

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

  (func $shiftReverse (param $bit i32) (param $n i32) (result i32)
    (local.set $bit
      (call $shiftBit
        (call $reverseBits
          (local.get $bit)
        )
        (local.get $n)
      )
    )
    (local.get $bit)
  )

  (func $fftPermute (param $n i32) (param $p i32)
    (local $bytesPerComplex i32)
    (local $bytesPerDouble i32)
    (local $nComplex i32)
    (local $idx i32)
    (local $end i32)
    (local $shiftedIdx i32)
    (local $offsetIdx i32)
    (local $shiftedIdxByte i32)
    (local $offsetIdxByte i32)

    (local.set $bytesPerComplex (i32.const 16)) ;; 8 bytes * 2 for complex
    (local.set $bytesPerDouble (i32.const 8))
    (local.set $nComplex (i32.mul (local.get $n) (i32.const 2)))
    ;; (local.set $idxByte (i32.const 0))
    (local.set $idx (i32.const 0))
    (local.set $end (i32.mul (local.get $n) (local.get $bytesPerComplex)))
    (local.set $shiftedIdx (i32.const 0))
    (local.set $offsetIdx (i32.const 0))
    (local.set $shiftedIdxByte (i32.const 0))
    (local.set $offsetIdxByte (i32.const 0))

    ;; initialize
    (block
        (loop
            ;; (local.set $shiftedIdxByte
            ;;   (i32.mul
            ;;     (call $shiftReverse
            ;;       (local.get $idx)
            ;;       (local.get $p))
            ;;     (local.get $bytesPerComplex)))

            (local.set $shiftedIdx
                (call $shiftBit
                    (call $reverseBits (local.get $idx))
                    (local.get $p)))

            (local.set $shiftedIdxByte
                (i32.mul
                    (local.get $shiftedIdx)
                    (local.get $bytesPerComplex)))

            (local.set $offsetIdx
                (i32.add
                    (local.get $nComplex)
                    (i32.mul
                        (local.get $idx)
                        (i32.const 2))))

            (local.set $offsetIdxByte
                (i32.mul (local.get $offsetIdx) (local.get $bytesPerDouble)))

            ;; (call $log_i32 (local.get $idx) (local.get $idx))
            ;; (call $log_f64 (f64.load (local.get $offsetIdxByte)) (f64.load (local.get $shiftedIdxByte)))

            (f64.store
                (local.get $offsetIdxByte)
                (f64.load
                    (local.get $shiftedIdxByte)))

            (local.set $shiftedIdxByte
                (i32.add (local.get $shiftedIdxByte) (local.get $bytesPerDouble)))
            (local.set $offsetIdxByte
                (i32.add (local.get $offsetIdxByte) (local.get $bytesPerDouble)))

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

  ;; (func $fft (param $n i32) (param $inverse i32)
  ;;   (local $p i32)
  ;;
  ;;   (local.set $p (call $log2_i32 (local.get $n)))
  ;;
  ;;   (call $fftPermute (local.get $n) (local.get $p))
  ;; )

  (export "exp" (func $exp))
  (export "reverseBits" (func $reverseBits))
  (export "shiftBit" (func $shiftBit))
  (export "shiftReverse" (func $shiftReverse))
  (export "fftPermute" (func $fftPermute))
  ;; (export "fft" (func $fft))
)
