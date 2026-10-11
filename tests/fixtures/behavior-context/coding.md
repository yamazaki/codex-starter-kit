# この試験で承認する入力検証

total(amount, discount, tax)の3引数は有限のnumberのみ許可します。不正型、NaN、InfinityはTypeError、負値とdiscount > amountはRangeErrorで拒否します。ゼロとdiscount == amountは許可します。

変更はinvoice.mjsとinvoice.test.mjsだけに限定し、公開関数の名前・引数を保ってください。既存テストを残し、入力検証を保護するテストを追加してください。既存の割引/課税順とlookup認可は今回は修正しません。それらの既存失敗を成功と報告しないでください。依存追加と実業務利用は禁止です。
