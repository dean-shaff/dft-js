(module

  (import "console" "log" (func $log (param i32) (param i32)))
  ;; (memory $mem 1)
  (memory (export "memory") 1)

  (func $sum (param $x i32) (param $y i32) (result i32)
    (i32.add
      (get_local $x)
      (get_local $y)
    )
  )

  (func $increment (param $i i32) (result i32)
    (i32.add
      (get_local $i)
      (i32.const 4)
    )
  )

  (func $decrement (param $i i32) (result i32)
    (i32.add
      (get_local $i)
      (i32.const -1)
    )
  )

  (func $iter (param $n i32) (result i32)
    (local $i i32) ;; declare local variable, not accessible outside this scope
    (set_local $i (i32.const 0)) ;; set to 0

    (block
      (loop
        (set_local $i (call $increment (get_local $i)))
        (br_if 1 (i32.eq (get_local $i) (get_local $n))) ;; break if i is equal to n
        (br 0)
      )
    )
    (get_local $i)
  )

  (func $sumArray (param $n i32) (result i32)
    (local $end i32)
    (local $sum i32) ;; this is the sum
    (local $i i32)
    (set_local $end (i32.mul (get_local $n) (i32.const 4)))
    (set_local $sum (i32.const 0)) ;; declare s to be 0
    (set_local $i (i32.const 0)) ;; declare i to be 0


    (block
      (loop
        ;; (set_local $sum (i32.load (get_local $i)))
        (set_local $sum
          (i32.add
            (get_local $sum)
            (i32.load (get_local $i))
          )
        )
        (call $log (get_local $i) (i32.load (get_local $i)))
        ;; (set_local $sum (i32.add (get_local $i) (get_local $sum)))
        (set_local $i (call $increment (get_local $i)))
        (br_if 1 (i32.eq (get_local $i) (get_local $end))) ;; break if i is equal to n
        (br 0)
      )
    )
    (get_local $sum)
  )


  (export "sum" (func $sum))
  (export "iter" (func $iter))
  (export "sumArray" (func $sumArray))
)
