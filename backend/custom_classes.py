def define_custom_classes(onto):
    def define_custom_classes(onto):
        with onto:
            class HighValueTransaction(onto.TronTransaction):
                equivalent_to = [
                    onto.TronTransaction & (onto.valueTronTransaction >= 1000000000)
                ]
